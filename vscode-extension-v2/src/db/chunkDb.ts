import * as os from 'os';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';

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
        const dbPath = path.join(homeDir, 'pytypewizard_chunks.db');
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

    async searchChunks(searchQuery: string, page: number = 1, pageSize: number = 10): Promise<{ chunks: CodeChunk[], total: number }> {
        const searchTerm = searchQuery.trim();
        
        const offset = (page - 1) * pageSize;
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM chunks_fts 
            WHERE chunks_fts MATCH ?
        `;

        const searchSql = `
            SELECT chunks.*
            FROM chunks_fts 
            JOIN chunks ON chunks.id = chunks_fts.id
            WHERE chunks_fts MATCH ?
            ORDER BY rank
            LIMIT ? OFFSET ?
        `;

        const total = await new Promise<{ total: number }>((resolve, reject) => {
            this.db.get(countQuery, [searchTerm], (err, row) => {
                if (err) reject(err);
                resolve(row as { total: number });
            });
        });

        const chunks = await new Promise<CodeChunk[]>((resolve, reject) => {
            this.db.all(searchSql, [searchTerm, pageSize, offset], (err, rows) => {
                if (err) reject(err);
                resolve(rows as CodeChunk[]);
            });
        });

        return { chunks, total: total.total };
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
