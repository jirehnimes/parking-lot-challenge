import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { ParkCarRequestDto, UnparkCarRequestDto } from '@/dto/parking-lot.dto';
import { ParkingLotService } from '@/services';
import { autoBindMethods, logClassInitialized, setBadRequestResponse } from '@/utils/common.util';
import { ValidateRequest } from '@/validators/request.validator';

@injectable()
export class ParkingLotController {
  @inject(ParkingLotService)
  private parkingLotService!: ParkingLotService;

  constructor() {
    autoBindMethods(this);

    logClassInitialized(ParkingLotController.name);
  }

  async getAll(request: Request, response: Response) {
    try {
      const data = await this.parkingLotService.getAll();

      response.json({ data });
    } catch (error) {
      setBadRequestResponse(response, error as Error);
    }
  }

  @ValidateRequest(ParkCarRequestDto)
  async parkCar(request: Request, response: Response) {
    try {
      const data = await this.parkingLotService.parkCar(request.body);

      response.json({ data });
    } catch (error) {
      setBadRequestResponse(response, error as Error);
    }
  }

  @ValidateRequest(UnparkCarRequestDto)
  async unparkCar(request: Request, response: Response) {
    try {
      const data = await this.parkingLotService.unparkCar(request.body);

      response.json({ data });
    } catch (error) {
      setBadRequestResponse(response, error as Error);
    }
  }
}
