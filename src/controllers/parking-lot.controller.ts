import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { ParkingLotService } from '@/services/parking-lot.service';

@injectable()
export class ParkingLotController {
  @inject(ParkingLotService)
  private parkingLotService!: ParkingLotService;

  foo = (request: Request, response: Response) => {
    const data = this.parkingLotService.parkCar();

    response.json({ data });
  };
}
