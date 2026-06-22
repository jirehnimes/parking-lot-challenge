import { inject, injectable } from 'inversify';
import { ParkingTransactionRepository } from '@/database/repositories';
import type { TCreateParkingTransaction, TParkingTransaction } from '@/types/parking-transaction.type';
import { logClassInitialized } from '@/utils/common.util';

@injectable()
export class ParkingTransactionService {
  @inject(ParkingTransactionRepository)
  private parkingTransactionRepository!: ParkingTransactionRepository;

  constructor() {
    logClassInitialized(ParkingTransactionService.name);
  }

  async getAll(): Promise<TParkingTransaction[]> {
    return await this.parkingTransactionRepository.allParkingTransactions();
  }

  async findParkingTransactionByLicensePlate(licensePlate: string): Promise<TParkingTransaction | null> {
    return await this.parkingTransactionRepository.findParkingTransactionByLicensePlate(licensePlate);
  }

  async createParkingTransaction(parkingTransaction: TCreateParkingTransaction): Promise<TParkingTransaction> {
    return await this.parkingTransactionRepository.createParkingTransaction(parkingTransaction);
  }

  async updateParkingTransaction(id: string, parkingTransaction: Partial<TParkingTransaction>): Promise<TParkingTransaction | null> {
    return await this.parkingTransactionRepository.update(id, parkingTransaction);
  }
}
