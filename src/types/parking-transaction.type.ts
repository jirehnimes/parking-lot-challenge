import type { VEHICLE_TYPE } from '@/constants';

export type TParkingTransaction = {
  id: string;
  entranceID: string;
  parkingSlotID: string;
  vehicleType: VEHICLE_TYPE;
  licensePlate: string;
  entryTime: string;
  exitTime: string | null;
  fare: number | null;
};

export type TCreateParkingTransaction = {
  entranceID: string;
  parkingSlotID: string;
  vehicleType: VEHICLE_TYPE;
  licensePlate: string;
  entryTime: string;
};
