import { inject, injectable } from 'inversify';
import { VEHICLE_TYPE } from '@/constants';
import { ParkingLotRepository } from '@/database/repositories';
import type { TParkingSlot } from '@/types/parking-lot.type';
import type { TParkingTransaction } from '@/types/parking-transaction.type';
import { logClassInitialized } from '@/utils/common.util';
import { ParkingFareService } from './parking-fare.service';
import { ParkingSlotService } from './parking-slot.service';
import { ParkingTransactionService } from './parking-transaction.service';

@injectable()
export class ParkingLotService {
  @inject(ParkingLotRepository)
  private parkingLotRepository!: ParkingLotRepository;

  @inject(ParkingSlotService)
  private parkingSlotService!: ParkingSlotService;

  @inject(ParkingFareService)
  private parkingFareService!: ParkingFareService;

  @inject(ParkingTransactionService)
  private parkingTransactionService!: ParkingTransactionService;

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
  async parkCar(): Promise<TParkingTransaction> {
    const request = {
      entranceID: 'E010002',
      vehicleType: VEHICLE_TYPE.SMALL,
      licensePlate: 'ABC123',
      entryTime: new Date().toISOString(),
    };
    const nearestParkingSlot = await this.parkingSlotService.findNearestAvailable(
      request.entranceID,
      request.vehicleType,
    );

    const parkingTransaction = await this.parkingTransactionService.createParkingTransaction({
      entranceID: request.entranceID,
      parkingSlotID: nearestParkingSlot.id,
      vehicleType: request.vehicleType,
      licensePlate: request.licensePlate,
      entryTime: request.entryTime,
    });

    return parkingTransaction;
  }

  async unparkCar(): Promise<any> {
    const request = {
      licensePlate: 'ABC123',
    };

    const parkingTransaction = await this.parkingTransactionService.findParkingTransactionByLicensePlate(request.licensePlate);

    if (!parkingTransaction) {
      throw new Error(`No parking transaction found for license plate ${request.licensePlate}`);
    }

    const parkingSlot = await this.parkingLotRepository.findParkingSlotByID(parkingTransaction?.parkingSlotID || '');

    if (!parkingSlot) {
      throw new Error(`Parking slot with ID ${parkingTransaction.parkingSlotID} not found.`);
    }

    const entryTimeDate = new Date(parkingTransaction.entryTime);
    const exitTimeDate = new Date();
    const fare = this.parkingFareService.calculateFare(parkingSlot.type, entryTimeDate, exitTimeDate);

    const updatedParkingTransaction = await this.parkingTransactionService.updateParkingTransaction(parkingTransaction.id, {
      exitTime: exitTimeDate.toISOString(),
      fare,
    });

    return updatedParkingTransaction;
  }

  async getAllParkingSlots(): Promise<TParkingSlot[]> {
    return await this.parkingLotRepository.allParkingSlots();
  }
}
