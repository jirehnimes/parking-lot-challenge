import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { ParkCarRequestDto, UnparkCarRequestDto } from '@/dto/parking-lot.dto';
import { ParkingLotService } from '@/services';
import { logClassInitialized } from '@/utils/common.util';
import { ValidateRequest } from '@/validators/request.validator';

@injectable()
export class ParkingLotController {
  @inject(ParkingLotService)
  private parkingLotService!: ParkingLotService;

  constructor() {
    this.getAllParkingSlots = this.getAllParkingSlots.bind(this);
    this.parkCar = this.parkCar.bind(this);
    this.unparkCar = this.unparkCar.bind(this);

    logClassInitialized(ParkingLotController.name);
  }

  async getAllParkingSlots(request: Request, response: Response) {
    const data = await this.parkingLotService.getAllParkingSlots();

    response.json({ data });
  }

  @ValidateRequest(ParkCarRequestDto)
  async parkCar(request: Request, response: Response) {
    const data = await this.parkingLotService.parkCar(request.body);

    response.json({ data });
  }

  @ValidateRequest(UnparkCarRequestDto)
  async unparkCar(request: Request, response: Response) {
    const data = await this.parkingLotService.unparkCar(request.body);

    response.json({ data });
  }
}
