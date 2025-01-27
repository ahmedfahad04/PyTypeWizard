import { DatabaseManager } from './database';

let databaseInstance: DatabaseManager | null = null;

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
