import { inject, injectable, postConstruct } from 'inversify';
import { PARKING_SLOT_STATUS, PARKING_SLOT_TYPE } from '@/constants/parking.constant';
import type { TParkingSlot } from '@/types/parking-lot.type';
import { logClassInitialized } from '@/utils/common.util';
import { DatabaseService } from '../database.service';
import type { Model } from './model';

@injectable()
export class ParkingLotModel implements Model<TParkingSlot> {
  @inject(DatabaseService)
  private databaseService!: DatabaseService;

  TABLE_NAME = 'parking_lot';

  id!: string;
  floor!: number;
  type: PARKING_SLOT_TYPE = PARKING_SLOT_TYPE.SMALL;
  status: PARKING_SLOT_STATUS = PARKING_SLOT_STATUS.AVAILABLE;

  constructor() {
    logClassInitialized(ParkingLotModel.name);
  }

  @postConstruct()
  initializeDatabase(): void {
    this.databaseService.createTable(this.TABLE_NAME);
  }

  async create(parkingSlot: TParkingSlot): Promise<TParkingSlot> {
    const currentData = this.databaseService.getTableData(this.TABLE_NAME);
    const newData = [...currentData, parkingSlot];
    this.databaseService.updateTableData(this.TABLE_NAME, newData);

    return await parkingSlot;
  }

  async update(id: string, item: Partial<TParkingSlot>): Promise<TParkingSlot | null> {
    throw new Error('Method not implemented.');
  }

  async delete(id: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async findById(id: string): Promise<TParkingSlot | null> {
    const parkingSlots = await this.databaseService.getTableData(this.TABLE_NAME);
    const parkingSlot = parkingSlots.find((slot) => slot.id === id);

    return parkingSlot || null;
  }

  /**
   * Limitations:
   * - This method does not support filtering, sorting, or pagination.
   *
   * @returns An array of all parking slots.
   */
  async findAll(): Promise<TParkingSlot[]> {
    return await this.databaseService.getTableData(this.TABLE_NAME);
  }
}
