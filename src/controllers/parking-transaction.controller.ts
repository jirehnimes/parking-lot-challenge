import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { ParkingTransactionService } from '@/services/parking-transaction.service';
import { autoBindMethods, logClassInitialized, setBadRequestResponse } from '@/utils/common.util';

@injectable()
export class ParkingTransactionController {
  @inject(ParkingTransactionService)
  private parkingTransactionService!: ParkingTransactionService;

  constructor() {
    autoBindMethods(this);

    logClassInitialized(ParkingTransactionController.name);
  }

  async getAll(request: Request, response: Response) {
    try {
      const data = await this.parkingTransactionService.getAll();

      response.json({ data });
    } catch (error) {
      setBadRequestResponse(response, error as Error);
    }
  }
}
