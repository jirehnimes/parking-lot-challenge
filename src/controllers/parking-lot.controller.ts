import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { ParkingLotService } from '@/services';
import { logClassInitialized } from '@/utils/common.util';

@injectable()
export class ParkingLotController {
  @inject(ParkingLotService)
  private parkingLotService!: ParkingLotService;

  constructor() {
    logClassInitialized(ParkingLotController.name);
  }

  getAllParkingSlots = async (request: Request, response: Response) => {
    const data = await this.parkingLotService.getAllParkingSlots();

    response.json({ data });
  };

  parkCar = async (request: Request, response: Response) => {
    const data = await this.parkingLotService.parkCar();

    response.json({ data });
  };

  unparkCar = async (request: Request, response: Response) => {
    const data = await this.parkingLotService.unparkCar();

    response.json({ data });
  };
}
