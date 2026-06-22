import { inject, injectable } from 'inversify';
import { ParkingTransactionRepository } from '@/database/repositories';
import type { TParkingTransaction } from '@/types/parking-transaction.type';
import { logClassInitialized } from '@/utils/common.util';

@injectable()
export class ParkingTransactionService {
  @inject(ParkingTransactionRepository)
  private parkingTransactionRepository!: ParkingTransactionRepository;

  constructor() {
    logClassInitialized(ParkingTransactionService.name);
  }

  async getAllParkingTransactions(): Promise<TParkingTransaction[]> {
    return await this.parkingTransactionRepository.allParkingTransactions();
  }
}
