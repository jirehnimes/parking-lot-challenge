import type { VEHICLE_TYPE } from '@/constants';

export type TParkingTransaction = {
  id: string;
  vehicleType: VEHICLE_TYPE;
  licensePlate: string;
  entryTime: string;
  exitTime?: string;
};
