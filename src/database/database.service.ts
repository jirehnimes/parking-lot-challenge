/** biome-ignore-all lint/suspicious/noExplicitAny: As a mock database, we can use any type for the data stored in the tables. */
import { injectable } from 'inversify';
import { logClassInitialized } from '@/utils/common.util';

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
