import { format } from 'date-fns';
import { inject, injectable } from 'inversify';
import type { TCreateParkingTransaction, TParkingTransaction } from '@/types/parking-transaction.type';
import { logClassInitialized } from '@/utils/common.util';
import { ParkingTransactionModel } from '../models';

@injectable()
export class ParkingTransactionRepository {
  @inject(ParkingTransactionModel)
  private parkingTransactionModel!: ParkingTransactionModel;

  constructor() {
    logClassInitialized(ParkingTransactionRepository.name);
  }

  async allParkingTransactions(): Promise<TParkingTransaction[]> {
    return await this.parkingTransactionModel.findAll();
  }

  async findParkingTransactionByLicensePlate(licensePlate: string): Promise<TParkingTransaction | null> {
    const parkingTransactions = await this.parkingTransactionModel.findAll();
    const parkingTransaction = parkingTransactions.find((transaction) => transaction.licensePlate === licensePlate);

    return parkingTransaction || null;
  }

  async createParkingTransaction({
    entranceID,
    parkingSlotID,
    vehicleType,
    licensePlate,
    entryTime,
  }: TCreateParkingTransaction): Promise<TParkingTransaction> {
    const nowDate = new Date();
    const id = this.createID(nowDate, licensePlate, parkingSlotID);

    const parkingTransaction: TParkingTransaction = {
      id,
      entranceID,
      parkingSlotID,
      vehicleType,
      licensePlate,
      entryTime,
      exitTime: null,
      fare: null,
    };

    return await this.parkingTransactionModel.create(parkingTransaction);
  }

  async update(id: string, item: Partial<TParkingTransaction>): Promise<TParkingTransaction | null> {
    const existingTransaction = await this.parkingTransactionModel.findById(id);

    if (!existingTransaction) {
      return null;
    }

    const updatedTransaction: TParkingTransaction = {
      ...existingTransaction,
      ...item,
    };

    await this.parkingTransactionModel.update(id, updatedTransaction);

    return updatedTransaction;
  }

  private createID(currentDate: Date, licensePlate: string, parkingSlotID: string): string {
    const formattedDate = format(currentDate, 'yyyyMMddHHmmss');

    return `PT${formattedDate}-${licensePlate}-${parkingSlotID}`;
  }
}
