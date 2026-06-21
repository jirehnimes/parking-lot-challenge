import type { PARKING_SLOT_STATUS, PARKING_SLOT_TYPE, VEHICLE_TYPE } from '@/constants/parking.constant';

export type TParkingVehicleRequest = {
  vehicleType: VEHICLE_TYPE;
  licensePlate: string;
  entryTime: Date;
};

export type TParkingSlotLocation = [number, number];

export type TParkingSlot = {
  type: PARKING_SLOT_TYPE,
  status: PARKING_SLOT_STATUS,
  location: TParkingSlotLocation,
};
