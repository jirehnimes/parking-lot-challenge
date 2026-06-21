import { PARKING_SLOT_STATUS, PARKING_SLOT_TYPE } from '@/constants/parking.constant';

export class ParkingLotModel {
  id!: string;
  floor!: number;
  type: PARKING_SLOT_TYPE = PARKING_SLOT_TYPE.SMALL;
  status: PARKING_SLOT_STATUS = PARKING_SLOT_STATUS.AVAILABLE;

  tableName = 'parking_lot';

  constructor() {
    console.log('ParkingLotModel initialized');
  }
}
