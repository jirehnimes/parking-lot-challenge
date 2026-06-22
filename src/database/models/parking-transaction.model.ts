import { inject, injectable, postConstruct } from 'inversify';
import type { TParkingTransaction } from '@/types/parking-transaction.type';
import { logClassInitialized } from '@/utils/common.util';
import { DatabaseService } from '../database.service';
import type { Model } from './model';

@injectable()
export class ParkingTransactionModel implements Model<TParkingTransaction> {
  @inject(DatabaseService)
  private databaseService!: DatabaseService;

  TABLE_NAME = 'parking_transaction';

  constructor() {
    logClassInitialized(ParkingTransactionModel.name);
  }

  @postConstruct()
  initializeDatabase(): void {
    this.databaseService.createTable(this.TABLE_NAME);
  }

  async create(parkingTransaction: TParkingTransaction): Promise<TParkingTransaction> {
    const currentData = this.databaseService.getTableData(this.TABLE_NAME);
    const newData = [...currentData, parkingTransaction];
    this.databaseService.updateTableData(this.TABLE_NAME, newData);

    return await parkingTransaction;
  }

  async update(id: string, parkingTransaction: Partial<TParkingTransaction>): Promise<TParkingTransaction | null> {
    const existingParkingTransaction = await this.findById(id);

    if (!existingParkingTransaction) {
      return null;
    }

    const updatedParkingTransaction: TParkingTransaction = {
      ...existingParkingTransaction,
      ...parkingTransaction,
    };

    const currentData = this.databaseService.getTableData(this.TABLE_NAME);
    const newData = currentData.map((transaction) => (transaction.id === id ? updatedParkingTransaction : transaction));
    this.databaseService.updateTableData(this.TABLE_NAME, newData);

    return updatedParkingTransaction;
  }

  async delete(id: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async findById(id: string): Promise<TParkingTransaction | null> {
    const parkingTransactions = await this.databaseService.getTableData(this.TABLE_NAME);
    const parkingTransaction = parkingTransactions.find((transaction) => transaction.id === id);

    return parkingTransaction || null;
  }

  /**
   * Limitations:
   * - This method does not support filtering, sorting, or pagination.
   *
   * @returns An array of all parking slots.
   */
  async findAll(): Promise<TParkingTransaction[]> {
    return await this.databaseService.getTableData(this.TABLE_NAME);
  }
}
