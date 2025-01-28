import { ChunkDatabaseManager } from './chunkDb';
import { DatabaseManager } from './database';

let databaseInstance: DatabaseManager | null = null;
let chunkDatabaseManager: ChunkDatabaseManager | null = null;

export async function getDatabaseManager(): Promise<DatabaseManager> {
    if (!databaseInstance) {
        databaseInstance = new DatabaseManager();
        await databaseInstance.initializeDatabase();
    }
    return databaseInstance;
}

export function closeDatabaseConnection(): void {
    if (databaseInstance) {
        databaseInstance.close();
        databaseInstance = null;
    }
}

export async function getChunkDatabaseManager(): Promise<ChunkDatabaseManager> {
    if (!chunkDatabaseManager) {
        chunkDatabaseManager = new ChunkDatabaseManager();
        await chunkDatabaseManager.initializeDatabase();
    }
    return chunkDatabaseManager;
}

export function closeChunkDatabaseConnection(): void {
    if (chunkDatabaseManager) {
        chunkDatabaseManager.close();
        chunkDatabaseManager = null;
    }
}