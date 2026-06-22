import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { ParkCarRequestDto, UnparkCarRequestDto } from '@/dto/parking-lot.dto';
import { ParkingLotService } from '@/services';
import { autoBindMethods, logClassInitialized, setBadRequestResponse } from '@/utils/common.util';
import { ValidateRequest } from '@/validators/request.validator';

/**
 * Assumptions:
 * - Entry/exit points are automated and can identify the car and its details (e.g., license plate, entry time) when it enters or leaves the parking lot complex.
 * - When a car enters the parking lot complex, the sensor triggers the parkCar method.
 * - When a car leaves the parking lot complex, the sensor triggers the unparkCar method.
 * - Even if the car leaves the parking slot but never triggers the unparkCar method (e.g., due to sensor failure), it is still considered as parked in the parking lot complex until the unparkCar method is triggered.
 *
 * For this implementation,
 * parkCar is considered as car entering the parking lot complex.
 * unparkCar is considered as car leaving the parking lot complex.
 *
 * Better implementation would be:
 * enterCar for car entering the parking lot complex.
 * exitCar for car leaving the parking lot complex.
 * parkCar for car parking in a specific parking lot.
 * unparkCar for car unparking from a specific parking lot.
 * But for simplicity, we are using parkCar and unparkCar.
 */
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
