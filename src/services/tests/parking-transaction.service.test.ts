import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { VEHICLE_TYPE } from '@/constants';
import { ParkingTransactionService } from '@/services/parking-transaction.service';
import type { TCreateParkingTransaction, TParkingTransaction } from '@/types/parking-transaction.type';

type StubbedParkingTransactionService = Omit<ParkingTransactionService, 'parkingTransactionRepository'> & {
  parkingTransactionRepository: {
    findAll: ReturnType<typeof jest.fn>;
    findActiveByLicensePlate: ReturnType<typeof jest.fn>;
    create: ReturnType<typeof jest.fn>;
    update: ReturnType<typeof jest.fn>;
  };
};

const transactionFixture: TParkingTransaction = {
  id: 'PT20240101000000-ABC123-SP010001',
  entranceID: 'E010002',
  parkingSlotID: 'SP010001',
  vehicleType: VEHICLE_TYPE.SMALL,
  licensePlate: 'ABC123',
  entryTime: '2024-01-01T00:00:00.000Z',
  exitTime: null,
  fare: null,
};

describe(ParkingTransactionService.name, () => {
  let parkingTransactionService: StubbedParkingTransactionService;

  beforeEach(() => {
    parkingTransactionService = new ParkingTransactionService() as unknown as StubbedParkingTransactionService;
    parkingTransactionService.parkingTransactionRepository = {
      findAll: jest.fn(),
      findActiveByLicensePlate: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
  });

  describe('getAll', () => {
    it('delegates to the repository and returns all transactions', async () => {
      parkingTransactionService.parkingTransactionRepository.findAll.mockResolvedValue([
        transactionFixture,
      ]);

      const transactions = await parkingTransactionService.getAll();

      expect(parkingTransactionService.parkingTransactionRepository.findAll).toHaveBeenCalledTimes(1);
      expect(transactions).toEqual([transactionFixture]);
    });
  });

  describe('findActiveByLicensePlate', () => {
    it('delegates to the repository with the given license plate', async () => {
      parkingTransactionService.parkingTransactionRepository.findActiveByLicensePlate.mockResolvedValue(
        transactionFixture,
      );

      const transaction = await parkingTransactionService.findActiveByLicensePlate('ABC123');

      expect(
        parkingTransactionService.parkingTransactionRepository.findActiveByLicensePlate,
      ).toHaveBeenCalledWith('ABC123');
      expect(transaction).toBe(transactionFixture);
    });

    it('returns null when the repository finds no active transaction', async () => {
      parkingTransactionService.parkingTransactionRepository.findActiveByLicensePlate.mockResolvedValue(
        null,
      );

      const transaction = await parkingTransactionService.findActiveByLicensePlate('UNKNOWN');

      expect(transaction).toBeNull();
    });
  });

  describe('create', () => {
    it('delegates to the repository with the given transaction data', async () => {
      const createRequest: TCreateParkingTransaction = {
        entranceID: 'E010002',
        parkingSlotID: 'SP010001',
        vehicleType: VEHICLE_TYPE.SMALL,
        licensePlate: 'ABC123',
        entryTime: '2024-01-01T00:00:00.000Z',
      };
      parkingTransactionService.parkingTransactionRepository.create.mockResolvedValue(
        transactionFixture,
      );

      const transaction = await parkingTransactionService.create(createRequest);

      expect(parkingTransactionService.parkingTransactionRepository.create).toHaveBeenCalledWith(
        createRequest,
      );
      expect(transaction).toBe(transactionFixture);
    });
  });

  describe('update', () => {
    it('delegates to the repository with the given id and partial update', async () => {
      const updatedTransaction: TParkingTransaction = {
        ...transactionFixture,
        exitTime: '2024-01-01T01:00:00.000Z',
        fare: 40,
      };
      parkingTransactionService.parkingTransactionRepository.update.mockResolvedValue(
        updatedTransaction,
      );

      const transaction = await parkingTransactionService.update(transactionFixture.id, {
        exitTime: '2024-01-01T01:00:00.000Z',
        fare: 40,
      });

      expect(parkingTransactionService.parkingTransactionRepository.update).toHaveBeenCalledWith(
        transactionFixture.id,
        { exitTime: '2024-01-01T01:00:00.000Z', fare: 40 },
      );
      expect(transaction).toBe(updatedTransaction);
    });

    it('returns null when the repository cannot find the transaction to update', async () => {
      parkingTransactionService.parkingTransactionRepository.update.mockResolvedValue(null);

      const transaction = await parkingTransactionService.update('UNKNOWN', { fare: 40 });

      expect(transaction).toBeNull();
    });
  });
});
