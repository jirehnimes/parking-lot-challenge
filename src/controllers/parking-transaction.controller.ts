import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { ParkingTransactionService } from '@/services/parking-transaction.service';
import { logClassInitialized } from '@/utils/common.util';

@injectable()
export class ParkingTransactionController {
  @inject(ParkingTransactionService)
  private parkingTransactionService!: ParkingTransactionService;

  constructor() {
    logClassInitialized(ParkingTransactionController.name);
  }

  getAllParkingTransactions = async (request: Request, response: Response) => {
    const data = await this.parkingTransactionService.getAllParkingTransactions();

    response.json({ data });
  };
}
