import { inject, injectable } from 'inversify';
import { PARKING_SLOT_TYPE, VEHICLE_TYPE } from '@/constants';
import { ParkingLotRepository } from '@/database/repositories';
import type { TParkingSlot } from '@/types/parking-lot.type';
import { computeDistance, logClassInitialized } from '@/utils/common.util';

@injectable()
export class ParkingSlotService {
  @inject(ParkingLotRepository)
  private parkingLotRepository!: ParkingLotRepository;

  constructor() {
    logClassInitialized(ParkingSlotService.name);
  }

  async findNearestAvailable(entranceID: string, vehicleType: VEHICLE_TYPE): Promise<TParkingSlot> {
    const entrance = await this.parkingLotRepository.findParkingSlotByID(entranceID);
    const availableParkingSlots = await this.filterParkingSlotsByVehicleType(vehicleType);

    if (!entrance) {
      throw new Error(`Entrance with ID ${entranceID} not found.`);
    }

    if (availableParkingSlots.length === 0) {
      throw new Error('No available parking slots for the specified vehicle type.');
    }

    const nearestParkingSlot = this.computeAndGetNearestParkingSlot(entrance, availableParkingSlots);

    return nearestParkingSlot;
  }

  private async filterParkingSlotsByVehicleType(vehicleType: VEHICLE_TYPE): Promise<TParkingSlot[]> {
    const availableParkingSlots = await this.parkingLotRepository.allAvailableParkingSlots();

    return availableParkingSlots.filter((parkingSlot) => {
      if (vehicleType === VEHICLE_TYPE.SMALL) {
        return [
          PARKING_SLOT_TYPE.SMALL,
          PARKING_SLOT_TYPE.MEDIUM,
          PARKING_SLOT_TYPE.LARGE,
        ].includes(parkingSlot.type);
      } else if (vehicleType === VEHICLE_TYPE.MEDIUM) {
        return [PARKING_SLOT_TYPE.MEDIUM, PARKING_SLOT_TYPE.LARGE].includes(parkingSlot.type);
      } else if (vehicleType === VEHICLE_TYPE.LARGE) {
        return parkingSlot.type === PARKING_SLOT_TYPE.LARGE;
      }

      return false;
    });
  }

  private computeAndGetNearestParkingSlot(
    entrance: TParkingSlot,
    availableParkingSlots: TParkingSlot[],
  ): TParkingSlot {
    // Initialize with the first available parking slot as the nearest one.
    let nearestParkingSlot: TParkingSlot = availableParkingSlots[0];
    // Initialize minDistance to a large value to ensure any actual distance will be smaller.
    let minDistance = Number.MAX_SAFE_INTEGER;

    for (const parkingSlot of availableParkingSlots) {
      const distance = computeDistance(entrance.location, parkingSlot.location);

      if (distance < minDistance) {
        minDistance = distance;
        nearestParkingSlot = parkingSlot;
      }
    }

    return nearestParkingSlot;
  }
}
