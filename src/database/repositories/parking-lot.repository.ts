import { inject, injectable, postConstruct } from 'inversify';
import { PARKING_SLOT_STATUS, type PARKING_SLOT_TYPE } from '@/constants/parking.constant';
import { parkingLotLayout } from '@/data/parking-lot.data';
import type { TParkingSlot } from '@/types/parking-lot.type';
import { logClassInitialized } from '@/utils/common.util';
import { ParkingLotModel } from '../models';

@injectable()
export class ParkingLotRepository {
  @inject(ParkingLotModel)
  private parkingLotModel!: ParkingLotModel;

  constructor() {
    logClassInitialized(ParkingLotRepository.name);
  }

  @postConstruct()
  initializeDatabase(): void {
    this.initializeParkingSlots();
  }

  /**
   * Sample data:
   * [
   *   {
   *     id: 'SP010000',
   *     type: 'SP',
   *     status: 'A',
   *     floor: 1,
   *     location: [ 0, 0 ]
   *   },
   * ]
   */
  async initializeParkingSlots(): Promise<void> {
    const parkingSlots = parkingLotLayout.flatMap((floor, index) =>
      floor.flatMap((rows, indexRow) =>
        rows.map((slotType: PARKING_SLOT_TYPE, indexColumn) => {
          const floorString = String(index + 1).padStart(2, '0');
          const rowString = String(indexRow).padStart(2, '0');
          const columnString = String(indexColumn).padStart(2, '0');

          return {
            id: this.createID(slotType, floorString, rowString, columnString),
            type: slotType,
            status: PARKING_SLOT_STATUS.AVAILABLE,
            floor: index + 1,
            location: [indexRow, indexColumn],
          };
        }),
      ),
    );

    for (const slot of parkingSlots) {
      await this.parkingLotModel.create(slot as TParkingSlot);
    }
  }

  async allParkingSlots(): Promise<TParkingSlot[]> {
    return await this.parkingLotModel.findAll();
  }

  async allAvailableParkingSlots(): Promise<TParkingSlot[]> {
    const parkingSlots = await this.parkingLotModel.findAll();

    return parkingSlots.filter(
      (slot: TParkingSlot) => slot.status === PARKING_SLOT_STATUS.AVAILABLE,
    );
  }

  async findParkingSlotByID(id: string): Promise<TParkingSlot | null> {
    return await this.parkingLotModel.findById(id);
  }

  private createID(
    parkingSlotType: PARKING_SLOT_TYPE,
    floor: string,
    row: string,
    column: string,
  ): string {
    return `${parkingSlotType}${floor}${row}${column}`;
  }
}
