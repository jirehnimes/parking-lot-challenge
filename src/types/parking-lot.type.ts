import type { VEHICLE_TYPE } from '@/constants/parking.constant';

export type TParkingVehicleRequest = {
  vehicleType: VEHICLE_TYPE;
  licensePlate: string;
  entryTime: Date;
};
