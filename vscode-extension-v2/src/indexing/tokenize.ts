import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';
import * as vscode from 'vscode';
import Parser from 'web-tree-sitter';
import { outputChannel } from '../utils';

/**
 * Metadata for tokenized snippets.
 */
type TokenizedSnippet = {
    id: string; // Unique ID for each snippet
    filePath: string;
    snippetType: Parser.SyntaxNode['type'];
    startLine: number;
    endLine: number;
    content: string;
};

/**
 * Helper function to promisify SQLite operations.
 */
function runQuery(db: sqlite3.Database, query: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function allQuery(db: sqlite3.Database, query: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

/**
 * Initializes SQLite database and sets up the snippets table.
 */
export async function initializeDatabase() {
    outputChannel.appendLine('Initializing database...');

    // Resolve the path to ~/.test-sqlite/example.db
    const homeDir = os.homedir();
    const dbDir = path.join(homeDir, '.pytypewizard');
    const dbPath = path.join(dbDir, 'example.db');

    // Ensure the directory exists
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        outputChannel.appendLine(`Created directory: ${dbDir}`);
    }

    // Open or create the SQLite database
    const db = new sqlite3.Database(dbPath);

    try {
        // Set journal mode
        await runQuery(db, 'PRAGMA journal_mode=WAL;');

        // Create snippets table
        await runQuery(db, `
            CREATE TABLE IF NOT EXISTS snippets (
                id TEXT PRIMARY KEY,
                filePath TEXT NOT NULL,
                snippetType TEXT NOT NULL,
                startLine INTEGER NOT NULL,
                endLine INTEGER NOT NULL,
                content TEXT NOT NULL
            );
        `);

        // Create unique index
        await runQuery(db, `
            CREATE UNIQUE INDEX IF NOT EXISTS idx_snippets_unique 
            ON snippets(id, filePath);
        `);

        // Clean up duplicates if any
        await runQuery(db, `
            DELETE FROM snippets
            WHERE rowid NOT IN (
                SELECT MIN(rowid)
                FROM snippets
                GROUP BY id, filePath
            );
        `);

        outputChannel.appendLine('Database initialized successfully.');
    } catch (err: any) {
        vscode.window.showErrorMessage(`Error initializing database: ${err.message}`);
    } finally {
        // Close the database connection
        db.close((err) => {
            if (err) {
                vscode.window.showErrorMessage(`Error closing database: ${err.message}`);
            }
        });
    }
}

/**
 * Stores tokenized snippets in the SQLite database.
 * @param snippets - Array of tokenized snippets.
 */
export async function storeSnippets(snippets: TokenizedSnippet[]) {
    const homeDir = os.homedir();
    const dbPath = path.join(homeDir, '.test-sqlite', 'example.db');
    const db = new sqlite3.Database(dbPath);

    try {
        const insertStmt = db.prepare(`
            INSERT INTO snippets (id, filePath, snippetType, startLine, endLine, content)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const snippet of snippets) {
            await runQuery(db, `
                INSERT OR REPLACE INTO snippets (id, filePath, snippetType, startLine, endLine, content)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                snippet.id,
                snippet.filePath,
                snippet.snippetType,
                snippet.startLine,
                snippet.endLine,
                snippet.content,
            ]);
        }

        outputChannel.appendLine('Snippets stored successfully.');
    } catch (err: any) {
        vscode.window.showErrorMessage(`Error storing snippets: ${err.message}`);
    } finally {
        db.close((err) => {
            if (err) {
                vscode.window.showErrorMessage(`Error closing database: ${err.message}`);
            }
        });
    }
}

/**
 * Tokenizes TypeScript files into code snippets using Tree-sitter.
 * @param filePath - The file path to tokenize.
 * @param fileContent - The content of the file.
 * @returns An array of tokenized snippets with metadata.
 */
export async function tokenizeFile(filePath: string, fileContent: string): Promise<TokenizedSnippet[]> {
    outputChannel.appendLine(`Tokenizing file: ${filePath}`);

    const parser = await getParserForFile();
    if (!parser) {
        throw new Error('Parser could not be initialized.');
    }

    const tree = parser.parse(fileContent);
    const snippets: TokenizedSnippet[] = [];
    let snippetId = 1;

    /**
     * Recursively traverses the syntax tree to extract snippets.
     * @param node - Current syntax tree node.
     */
    function traverse(node: Parser.SyntaxNode): void {
        if (GET_SYMBOLS.includes(node.type)) {
            const snippetType = node.type;
            const startLine = node.startPosition.row;
            const endLine = node.endPosition.row + 1;

            let identifier: Parser.SyntaxNode | undefined;
            for (let i = node.children.length - 1; i >= 0; i--) {
                if (
                    node.children[i].type === 'identifier' ||
                    node.children[i].type === 'property_identifier'
                ) {
                    identifier = node.children[i];
                    break;
                }
            }

            if (identifier?.text) {
                snippets.push({
                    id: `${path.basename(filePath)}_${snippetId++}`,
                    filePath,
                    snippetType,
                    startLine,
                    endLine,
                    content: node.text,
                });
            }
        }

        // Traverse child nodes
        for (const child of node.children) {
            traverse(child);
        }
    }

    traverse(tree.rootNode);
    return snippets;
}

/**
 * Fetches a parser for the file.
 * @returns A Tree-sitter parser instance.
 */
export async function getParserForFile() {
    try {
        await Parser.init();
        const parser = new Parser();

        const wasmPath = path.resolve(__dirname, '../../media/tree-sitter-python.wasm');
        const pythonLanguage = await Parser.Language.load(wasmPath);

        if (!pythonLanguage) {
            throw new Error('Failed to load Python language for Tree-sitter.');
        }

        parser.setLanguage(pythonLanguage);
        return parser;
    } catch (err) {
        vscode.window.showErrorMessage(`Error initializing parser: ${err}`);
        return undefined;
    }
}

const GET_SYMBOLS: Parser.SyntaxNode['type'][] = [
    'class_declaration',
    'class_definition',
    'function_item',
    'function_definition',
    'method_declaration',
    'method_definition',
    'generator_function_declaration',
    'property_identifier',
    'field_declaration',
];

// Example Usage
(async () => {
    await initializeDatabase();

    const filePath = '/path/to/your/file.py';
    const fileContent = `
        class Example:
            def __init__(self):
                pass

            def method(self):
                pass
    `;

    const snippets = await tokenizeFile(filePath, fileContent);
    await storeSnippets(snippets);

    vscode.window.showInformationMessage('Tokenization and storage completed!');
})();