import { inject, injectable } from 'inversify';
import { VEHICLE_TYPE } from '@/constants';
import { ParkingLotRepository } from '@/database/repositories';
import type { TParkingSlot } from '@/types/parking-lot.type';
import { logClassInitialized } from '@/utils/common.util';
import { ParkingFareService } from './parking-fare.service';
import { ParkingSlotService } from './parking-slot.service';

@injectable()
export class ParkingLotService {
  @inject(ParkingLotRepository)
  private parkingLotRepository!: ParkingLotRepository;

  @inject(ParkingSlotService)
  private parkingSlotService!: ParkingSlotService;

  @inject(ParkingFareService)
  private parkingFareService!: ParkingFareService;

  constructor() {
    logClassInitialized(ParkingLotService.name);
  }

  // {
  //   "id": "E010002",
  //   "type": "E",
  //   "status": "A",
  //   "floor": 1,
  //   "location": [
  //     0,
  //     2
  //   ]
  // },
  async parkCar(): Promise<any> {
    const nearestParkingSlot = await this.parkingSlotService.findNearestAvailable('E010002', VEHICLE_TYPE.SMALL);

    return 'test';
  }

  async unparkCar(): Promise<any> {
    return 'test';
  }

  async getAllParkingSlots(): Promise<TParkingSlot[]> {
    return await this.parkingLotRepository.allParkingSlots();
  }
}
