import * as os from 'os';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';
import { PYTHON_KEYWORDS } from '../constant';

export interface CodeChunk {
    id: string;
    content: string;
    filePath: string;
    startLine: number;
    endLine: number;
    chunkType: 'function' | 'standalone';
    timestamp: string;
}

export class ChunkDatabaseManager {
    private db: sqlite3.Database;

    constructor() {
        const homeDir = os.homedir();
        const dbPath = path.join(homeDir, '.pytypewizard_chunks.db');
        this.db = new sqlite3.Database(dbPath);
    }

    public async initializeDatabase() {
        // Create the main chunks table
        const createMainTable = `
            CREATE TABLE IF NOT EXISTS chunks (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                filePath TEXT NOT NULL,
                startLine INTEGER NOT NULL,
                endLine INTEGER NOT NULL,
                chunkType TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )
        `;

        // Create FTS5 virtual table for full-text search
        const createFTSTable = `
            CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
                id,
                content,
                filePath,
                startLine UNINDEXED,
                endLine UNINDEXED,
                chunkType,
                timestamp UNINDEXED,
                content='chunks'
            )
        `;

        // Create triggers to keep FTS index in sync
        const createTriggers = `
            CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
                INSERT INTO chunks_fts(id, content, filePath, startLine, endLine, chunkType, timestamp)
                VALUES (new.id, new.content, new.filePath, new.startLine, new.endLine, new.chunkType, new.timestamp);
            END;

            CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
                INSERT INTO chunks_fts(chunks_fts, id, content, filePath, startLine, endLine, chunkType, timestamp)
                VALUES('delete', old.id, old.content, old.filePath, old.startLine, old.endLine, old.chunkType, old.timestamp);
            END;

            CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
                INSERT INTO chunks_fts(chunks_fts, id, content, filePath, startLine, endLine, chunkType, timestamp)
                VALUES('delete', old.id, old.content, old.filePath, old.startLine, old.endLine, old.chunkType, old.timestamp);
                INSERT INTO chunks_fts(id, content, filePath, startLine, endLine, chunkType, timestamp)
                VALUES (new.id, new.content, new.filePath, new.startLine, new.endLine, new.chunkType, new.timestamp);
            END;
        `;

        await this.runQuery(createMainTable);
        await this.runQuery(createFTSTable);
        await this.runQuery(createTriggers);
    }

    async addChunk(chunk: CodeChunk): Promise<void> {
        const query = `
            INSERT INTO chunks 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await this.runQuery(query, [
            chunk.id,
            chunk.content,
            chunk.filePath,
            chunk.startLine,
            chunk.endLine,
            chunk.chunkType,
            chunk.timestamp
        ]);
    }

    async addChunks(chunks: CodeChunk[]): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                const stmt = this.db.prepare('INSERT INTO chunks VALUES (?, ?, ?, ?, ?, ?, ?)');
                for (const chunk of chunks) {
                    stmt.run(
                        chunk.id,
                        chunk.content,
                        chunk.filePath,
                        chunk.startLine,
                        chunk.endLine,
                        chunk.chunkType,
                        chunk.timestamp,
                        (err) => {
                            if (err) reject(err);
                        }
                    );
                }
                stmt.finalize((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    }

    async getChunksByFile(filePath: string): Promise<CodeChunk[]> {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM chunks WHERE filePath = ? ORDER BY startLine ASC',
                [filePath],
                (err, rows) => {
                    if (err) reject(err);
                    resolve(rows as CodeChunk[]);
                }
            );
        });
    }

    async getAllChunks(): Promise<CodeChunk[]> {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM chunks ORDER BY timestamp DESC', (err, rows) => {
                if (err) reject(err);
                resolve(rows as CodeChunk[]);
            });
        });
    }

    public async searchChunks(query: string): Promise<CodeChunk[]> {


        let sanitizedQuery = query.replace(/[^\w\s]/gi, ' ');
        sanitizedQuery = sanitizedQuery.trim();
        let words = sanitizedQuery.split(/\s+/); // Split by spaces

        let filterWords = words.filter(word => {
            return !PYTHON_KEYWORDS.includes(word.toLowerCase());
        });

        let formattedQuery = filterWords.map(i => `"${i}"`).join(" OR ");

        return new Promise((resolve, reject) => {
            const searchQuery = `
                SELECT * 
                FROM chunks_fts 
                WHERE content MATCH ?
            `;
            this.db.all(searchQuery, [formattedQuery], (err, rows) => {
                if (err) reject(err);
                resolve(rows as CodeChunk[]);
            });
        });
    }

    public async searchChunksWithRanking(query: string): Promise<(CodeChunk & { relevance: number })[]> {
        return new Promise((resolve, reject) => {
            const searchQuery = `
                SELECT *, bm25(matchinfo(chunks_fts)) AS rank 
                FROM chunks_fts
                WHERE chunks_fts MATCH ?
                ORDER BY rank DESC;
            `;
            this.db.all(searchQuery, [query], (err, rows) => {
                if (err) reject(err);
                resolve(rows as (CodeChunk & { relevance: number })[]);
            });
        });
    }



    private runQuery(query: string, params: any[] = []): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(query, params, (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    }

    close(): void {
        this.db.close();
    }
}
