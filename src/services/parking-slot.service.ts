import { inject, injectable } from 'inversify';
import type { VEHICLE_TYPE } from '@/constants/parking.constant';
import { ParkingLotRepository } from '@/database/repositories';
import { logClassInitialized } from '@/utils/common.util';

@injectable()
export class ParkingSlotService {
  @inject(ParkingLotRepository)
  private parkingLotRepository!: ParkingLotRepository;

  constructor() {
    logClassInitialized(ParkingSlotService.name);
  }

  async findNearestAvailable(entranceID: string, vehicleType: VEHICLE_TYPE): Promise<any> {
    const entrance = await this.parkingLotRepository.findParkingSlotByID(entranceID);
    console.log('entrance', entrance);


  }
}
