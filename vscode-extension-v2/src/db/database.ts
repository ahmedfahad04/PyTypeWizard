import * as os from 'os';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';
import * as vscode from 'vscode';
import { Solution } from '../types/solution.type';

export class DatabaseManager {
    private db: sqlite3.Database;

    constructor() {
        try {
            const homeDir = os.homedir();
            const dbPath = path.join(homeDir, '.pytypewizard.db');

            this.db = new sqlite3.Database(dbPath);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to initialize database: ${error.message}`);
            throw error;
        }
    }

    public async initializeDatabase() {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS solutions (
                    id TEXT PRIMARY KEY,
                    errorType TEXT NOT NULL,
                    errorMessage TEXT NOT NULL,
                    originalCode TEXT NOT NULL,
                    suggestedSolution TEXT NOT NULL,
                    filePath TEXT NOT NULL,
                    lineNumber INTEGER NOT NULL,
                    timestamp TEXT NOT NULL
                )
            `;
            await this.runQuery(query);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create database table: ${error.message}`);
            throw error;
        }
    }

    async addSolution(solution: Solution): Promise<void> {
        try {
            const query = `
                INSERT INTO solutions 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            await this.runQuery(query, [
                solution.id,
                solution.errorType,
                solution.errorMessage,
                solution.originalCode,
                solution.suggestedSolution,
                solution.filePath,
                solution.lineNumber,
                solution.timestamp
            ]);
            vscode.window.showInformationMessage('Solution saved successfully');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save solution: ${error.message}`);
            throw error;
        }
    }

    async getSolution(errorMessage: string): Promise<Solution | null> {
        try {
            return new Promise((resolve, reject) => {
                this.db.get(
                    'SELECT * FROM solutions WHERE errorMessage = ?',
                    [errorMessage],
                    (err, row) => {
                        if (err) {
                            vscode.window.showErrorMessage(`Failed to retrieve solution: ${err.message}`);
                            reject(err);
                        }
                        resolve(row as Solution);
                    }
                );
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to get solution: ${error.message}`);
            throw error;
        }
    }

    async getAllSolutions(): Promise<Solution[]> {
        try {
            return new Promise((resolve, reject) => {
                this.db.all('SELECT * FROM solutions ORDER BY timestamp DESC', (err, rows) => {
                    if (err) {
                        vscode.window.showErrorMessage(`Failed to retrieve solutions: ${err.message}`);
                        reject(err);
                    }
                    resolve(rows as Solution[]);
                });
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Entry Already Exists`);
            throw error;
        }
    }

    public async getSolutionsByErrorType(errorType: string, limit: number = 5, latestFirst: boolean = true): Promise<Solution[]> {
        try {
            return new Promise((resolve, reject) => {
                const orderClause = latestFirst ? 'ORDER BY timestamp DESC' : 'ORDER BY timestamp ASC';
                this.db.all(
                    `SELECT * FROM solutions WHERE errorType = ? ${orderClause} LIMIT ?`,
                    [errorType, limit],
                    (err, rows) => {
                        if (err) {
                            vscode.window.showErrorMessage(`Failed to retrieve solutions: ${err.message}`);
                            reject(err);
                        }
                        resolve(rows as Solution[]);
                    }
                );
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to get solutions: ${error.message}`);
            throw error;
        }
    }

    async updateSolution(id: string, newSolution: Partial<Solution>): Promise<void> {
        try {
            const setClause = Object.keys(newSolution)
                .map(key => `${key} = ?`)
                .join(', ');
            const query = `UPDATE solutions SET ${setClause} WHERE id = ?`;
            const values = [...Object.values(newSolution), id];
            await this.runQuery(query, values);
            vscode.window.showInformationMessage('Solution updated successfully');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to update solution: ${error.message}`);
            throw error;
        }
    }

    public async deleteSolution(id: string): Promise<void> {
        try {
            const query = `DELETE FROM solutions WHERE id = ?`;
            await this.runQuery(query, [id]);
            vscode.window.showInformationMessage('Solution deleted successfully');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to delete solution: ${error.message}`);
            throw error;
        }
    }

    async searchSolutions(searchQuery: string, page: number = 1, pageSize: number = 5): Promise<{ solutions: Solution[], total: number }> {
        let queryString = searchQuery.trim();

        try {
            const offset = (page - 1) * pageSize;
            const searchTerm = `%${queryString}%`;

            const countQuery = `
                SELECT COUNT(*) as total FROM solutions 
                WHERE originalCode LIKE ? 
                OR suggestedSolution LIKE ? 
                OR errorMessage LIKE ?
            `;

            const searchQuery = `
                SELECT * FROM solutions 
                WHERE originalCode LIKE ? 
                OR suggestedSolution LIKE ? 
                OR errorMessage LIKE ?
                ORDER BY timestamp DESC
                LIMIT ? OFFSET ?
            `;

            const total = await new Promise<{ total: number }>((resolve, reject) => {
                this.db.get(countQuery, [searchTerm, searchTerm, searchTerm], (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row as { total: number });
                    }
                });
            });

            const solutions = await new Promise<Solution[]>((resolve, reject) => {
                this.db.all(searchQuery, [searchTerm, searchTerm, searchTerm, pageSize, offset], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows as Solution[]);
                    }
                });
            });

            return {
                solutions,
                total: total.total
            };
        } catch (error) {
            vscode.window.showErrorMessage(`Search failed: ${error.message}`);
            throw error;
        }
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
        try {
            this.db.close();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to close database connection: ${error.message}`);
            throw error;
        }
    }
}
