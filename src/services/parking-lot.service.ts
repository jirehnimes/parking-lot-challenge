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

  /**
   * Flow:
   * - Check if there's an active parking transaction for the given license plate.
   * - Find the nearest available parking slot for the given entrance and vehicle type.
   * - Create a parking transaction with the entrance ID, parking slot ID, vehicle type, license plate, and entry time.
   * - Update the parking slot status to OCCUPIED.
   * @param request TParkCarRequest Request data from the entry/exit machine.
   * @returns A promise that resolves to the created parking transaction.
   * @throws An error if there's already an active transaction for the license plate, if the entrance is not found, or if there are no available parking slots for the vehicle type.
   */
  async parkCar(request: TParkCarRequest): Promise<TParkingTransaction> {
    const existingActiveTransaction = await this.parkingTransactionService.findActiveByLicensePlate(request.licensePlate);

    if (existingActiveTransaction) {
      throw new Error(`A car with license plate ${request.licensePlate} is already parked.`);
    }

    const nearestParkingSlot = await this.parkingSlotService.findNearestAvailable(
      request.entranceID,
      request.vehicleType,
    );

    const parkingTransaction = await this.parkingTransactionService.create({
      entranceID: request.entranceID,
      parkingSlotID: nearestParkingSlot.id,
      vehicleType: request.vehicleType,
      licensePlate: request.licensePlate,
      entryTime: request.entryTime,
    });

    await this.parkingSlotService.updateStatus(nearestParkingSlot.id, PARKING_SLOT_STATUS.OCCUPIED);

    return parkingTransaction;
  }

  /**
   * Flow:
   * - Find the active parking transaction for the given license plate.
   * - Find the parking slot associated with the active transaction.
   * - Calculate the fare based on the parking slot type and the duration of the parking.
   * - Update the parking transaction with the exit time and calculated fare.
   * - Update the parking slot status to AVAILABLE.
   * @param request TUnparkCarRequest Request data from the entry/exit machine.
   * @returns A promise that resolves to the updated parking transaction or null if not found.
   * @throws An error if there's no active transaction for the license plate or if the parking slot is not found.
   */
  async unparkCar(request: TUnparkCarRequest): Promise<TParkingTransaction | null> {
    const parkingTransaction = await this.parkingTransactionService.findActiveByLicensePlate(request.licensePlate);

    if (!parkingTransaction) {
      throw new Error(`No active parking transaction found for license plate ${request.licensePlate}`);
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

    const updatedParkingTransaction = await this.parkingTransactionService.update(
      parkingTransaction.id,
      {
        exitTime: exitTimeDate.toISOString(),
        fare,
      },
    );

    await this.parkingSlotService.updateStatus(parkingSlot.id, PARKING_SLOT_STATUS.AVAILABLE);

    return updatedParkingTransaction;
  }

  /**
   * Get all parking slots in the parking lot, regardless of their status.
   * @returns A promise that resolves to an array of all parking slots.
   */
  async getAll(): Promise<TParkingSlot[]> {
    return await this.parkingLotRepository.allParkingSlots();
  }
}
