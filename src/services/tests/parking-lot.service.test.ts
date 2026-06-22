import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PARKING_SLOT_STATUS, PARKING_SLOT_TYPE, VEHICLE_TYPE } from '@/constants';
import { ParkingLotService } from '@/services/parking-lot.service';
import type { TParkCarRequest, TParkingSlot, TUnparkCarRequest } from '@/types/parking-lot.type';
import type { TParkingTransaction } from '@/types/parking-transaction.type';

type StubbedParkingLotService = Omit<
  ParkingLotService,
  'parkingLotRepository' | 'parkingSlotService' | 'parkingFareService' | 'parkingTransactionService'
> & {
  parkingLotRepository: {
    findParkingSlotByID: ReturnType<typeof jest.fn>;
    allParkingSlots: ReturnType<typeof jest.fn>;
  };
  parkingSlotService: {
    findNearestAvailable: ReturnType<typeof jest.fn>;
    updateStatus: ReturnType<typeof jest.fn>;
  };
  parkingFareService: {
    calculateFare: ReturnType<typeof jest.fn>;
  };
  parkingTransactionService: {
    findActiveByLicensePlate: ReturnType<typeof jest.fn>;
    create: ReturnType<typeof jest.fn>;
    update: ReturnType<typeof jest.fn>;
  };
};

const NOW = new Date('2024-01-01T12:00:00.000Z');

const slotFixture: TParkingSlot = {
  id: 'SP010001',
  type: PARKING_SLOT_TYPE.SMALL,
  status: PARKING_SLOT_STATUS.AVAILABLE,
  floor: 1,
  location: [0, 1],
};

const transactionFixture: TParkingTransaction = {
  id: 'PT20240101120000-ABC123-SP010001',
  entranceID: 'E010002',
  parkingSlotID: 'SP010001',
  vehicleType: VEHICLE_TYPE.SMALL,
  licensePlate: 'ABC123',
  entryTime: '2024-01-01T11:00:00.000Z',
  exitTime: null,
  fare: null,
};

describe(ParkingLotService.name, () => {
  let parkingLotService: StubbedParkingLotService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);

    parkingLotService = new ParkingLotService() as unknown as StubbedParkingLotService;
    parkingLotService.parkingLotRepository = {
      findParkingSlotByID: jest.fn(),
      allParkingSlots: jest.fn(),
    };
    parkingLotService.parkingSlotService = {
      findNearestAvailable: jest.fn(),
      updateStatus: jest.fn(),
    };
    parkingLotService.parkingFareService = {
      calculateFare: jest.fn(),
    };
    parkingLotService.parkingTransactionService = {
      findActiveByLicensePlate: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('parkCar', () => {
    const parkRequest: TParkCarRequest = {
      entranceID: 'E010002',
      vehicleType: VEHICLE_TYPE.SMALL,
      licensePlate: 'ABC123',
      entryTime: '2024-01-01T11:00:00.000Z',
    };

    it('throws when the license plate already has an active transaction', async () => {
      parkingLotService.parkingTransactionService.findActiveByLicensePlate.mockResolvedValue(
        transactionFixture,
      );

      await expect(parkingLotService.parkCar(parkRequest)).rejects.toThrow(
        'A car with license plate ABC123 is already parked.',
      );
      expect(parkingLotService.parkingSlotService.findNearestAvailable).not.toHaveBeenCalled();
    });

    it('parks the car in the nearest available slot and marks it occupied', async () => {
      parkingLotService.parkingTransactionService.findActiveByLicensePlate.mockResolvedValue(null);
      parkingLotService.parkingSlotService.findNearestAvailable.mockResolvedValue(slotFixture);
      parkingLotService.parkingTransactionService.create.mockResolvedValue(transactionFixture);

      const transaction = await parkingLotService.parkCar(parkRequest);

      expect(parkingLotService.parkingSlotService.findNearestAvailable).toHaveBeenCalledWith(
        'E010002',
        VEHICLE_TYPE.SMALL,
      );
      expect(parkingLotService.parkingTransactionService.create).toHaveBeenCalledWith({
        entranceID: 'E010002',
        parkingSlotID: slotFixture.id,
        vehicleType: VEHICLE_TYPE.SMALL,
        licensePlate: 'ABC123',
        entryTime: '2024-01-01T11:00:00.000Z',
      });
      expect(parkingLotService.parkingSlotService.updateStatus).toHaveBeenCalledWith(
        slotFixture.id,
        PARKING_SLOT_STATUS.OCCUPIED,
      );
      expect(transaction).toBe(transactionFixture);
    });

    it('propagates the error when there is no available slot for the vehicle type', async () => {
      parkingLotService.parkingTransactionService.findActiveByLicensePlate.mockResolvedValue(null);
      parkingLotService.parkingSlotService.findNearestAvailable.mockRejectedValue(
        new Error('No available parking slots for the specified vehicle type.'),
      );

      await expect(parkingLotService.parkCar(parkRequest)).rejects.toThrow(
        'No available parking slots for the specified vehicle type.',
      );
      expect(parkingLotService.parkingTransactionService.create).not.toHaveBeenCalled();
    });
  });

  describe('unparkCar', () => {
    const unparkRequest: TUnparkCarRequest = { licensePlate: 'ABC123' };

    it('throws when there is no active transaction for the license plate', async () => {
      parkingLotService.parkingTransactionService.findActiveByLicensePlate.mockResolvedValue(null);

      await expect(parkingLotService.unparkCar(unparkRequest)).rejects.toThrow(
        'No active parking transaction found for license plate ABC123',
      );
    });

    it('throws when the parking slot for the active transaction cannot be found', async () => {
      parkingLotService.parkingTransactionService.findActiveByLicensePlate.mockResolvedValue(
        transactionFixture,
      );
      parkingLotService.parkingLotRepository.findParkingSlotByID.mockResolvedValue(null);

      await expect(parkingLotService.unparkCar(unparkRequest)).rejects.toThrow(
        `Parking slot with ID ${transactionFixture.parkingSlotID} not found.`,
      );
    });

    it('calculates the fare, closes the transaction, and frees the slot', async () => {
      parkingLotService.parkingTransactionService.findActiveByLicensePlate.mockResolvedValue(
        transactionFixture,
      );
      parkingLotService.parkingLotRepository.findParkingSlotByID.mockResolvedValue(slotFixture);
      parkingLotService.parkingFareService.calculateFare.mockReturnValue(40);
      const closedTransaction: TParkingTransaction = {
        ...transactionFixture,
        exitTime: NOW.toISOString(),
        fare: 40,
      };
      parkingLotService.parkingTransactionService.update.mockResolvedValue(closedTransaction);

      const transaction = await parkingLotService.unparkCar(unparkRequest);

      expect(parkingLotService.parkingFareService.calculateFare).toHaveBeenCalledWith(
        slotFixture.type,
        new Date(transactionFixture.entryTime),
        NOW,
      );
      expect(parkingLotService.parkingTransactionService.update).toHaveBeenCalledWith(
        transactionFixture.id,
        { exitTime: NOW.toISOString(), fare: 40 },
      );
      expect(parkingLotService.parkingSlotService.updateStatus).toHaveBeenCalledWith(
        slotFixture.id,
        PARKING_SLOT_STATUS.AVAILABLE,
      );
      expect(transaction).toBe(closedTransaction);
    });
  });

  describe('getAll', () => {
    it('delegates to the repository and returns every parking slot regardless of status', async () => {
      const slots = [slotFixture];
      parkingLotService.parkingLotRepository.allParkingSlots.mockResolvedValue(slots);

      const result = await parkingLotService.getAll();

      expect(parkingLotService.parkingLotRepository.allParkingSlots).toHaveBeenCalledTimes(1);
      expect(result).toBe(slots);
    });
  });
});
