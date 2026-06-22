import { inject, injectable } from 'inversify';
import type { PARKING_SLOT_TYPE } from '@/constants';
import type { TParkingTransaction } from '@/types/parking-transaction.type';
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

  private createID(
    parkingSlotType: PARKING_SLOT_TYPE,
    floor: string,
    row: string,
    column: string,
  ): string {
    return `${parkingSlotType}${floor}${row}${column}`;
  }
}
