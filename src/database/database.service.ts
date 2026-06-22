/** biome-ignore-all lint/suspicious/noExplicitAny: As a mock database, we can use any type for the data stored in the tables. */
import { injectable } from 'inversify';
import { logClassInitialized } from '@/utils/common.util';

/**
 * A simple in-memory database service that uses a Map to store tables and their data.
 * Each table is represented as an array of records.
 * This service can easily be replaced with a real database like MariaDB
 * without affecting the rest of the application, as long as the same interface is maintained.
 *
 * Note: This implementation is not thread-safe and is intended for demonstration purposes only.
 */
@injectable()
export class DatabaseService {
  private database: Map<string, any>;

  constructor() {
    logClassInitialized(DatabaseService.name);
    this.database = new Map();
  }

  createTable(tableName: string, data?: any[]): void {
    // Create a new table if it doesn't exist, otherwise do nothing
    if (!this.database.has(tableName)) {
      this.database.set(tableName, data || []);
    }
  }

  getTableData(tableName: string): any[] {
    this.checkTableExists(tableName);

    return this.database.get(tableName);
  }

  updateTableData(tableName: string, data: any[]): void {
    this.checkTableExists(tableName);

    this.database.set(tableName, data);
  }

  private checkTableExists(tableName: string): void {
    if (!this.database.has(tableName)) {
      throw new Error(`Table ${tableName} does not exist.`);
    }
  }
}
