import { inject, injectable } from 'inversify';
import { PARKING_SLOT_STATUS } from '@/constants';
import { ParkingLotRepository } from '@/database/repositories';
import type { TParkCarRequest, TParkingSlot, TUnparkCarRequest } from '@/types/parking-lot.type';
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

  async parkCar(request: TParkCarRequest): Promise<TParkingTransaction> {
    // TODO: Add a validation if the car with the same license plate is already parked and not yet unparked. This can be done by checking if there's an active parking transaction for the given license plate.

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

    await this.parkingSlotService.updateStatus(nearestParkingSlot.id, PARKING_SLOT_STATUS.OCCUPIED);

    return parkingTransaction;
  }

  async unparkCar(request: TUnparkCarRequest): Promise<TParkingTransaction | null> {
    const parkingTransaction =
      await this.parkingTransactionService.findParkingTransactionByLicensePlate(
        request.licensePlate,
      );

    if (!parkingTransaction) {
      throw new Error(`No parking transaction found for license plate ${request.licensePlate}`);
    }

    const parkingSlot = await this.parkingLotRepository.findParkingSlotByID(
      parkingTransaction?.parkingSlotID || '',
    );

    if (!parkingSlot) {
      throw new Error(`Parking slot with ID ${parkingTransaction.parkingSlotID} not found.`);
    }

    const entryTimeDate = new Date(parkingTransaction.entryTime);
    const exitTimeDate = new Date();
    const fare = this.parkingFareService.calculateFare(
      parkingSlot.type,
      entryTimeDate,
      exitTimeDate,
    );

    const updatedParkingTransaction = await this.parkingTransactionService.updateParkingTransaction(
      parkingTransaction.id,
      {
        exitTime: exitTimeDate.toISOString(),
        fare,
      },
    );

    await this.parkingSlotService.updateStatus(parkingSlot.id, PARKING_SLOT_STATUS.AVAILABLE);

    return updatedParkingTransaction;
  }

  async getAllParkingSlots(): Promise<TParkingSlot[]> {
    return await this.parkingLotRepository.allParkingSlots();
  }
}
