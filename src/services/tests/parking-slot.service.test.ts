import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PARKING_SLOT_STATUS, PARKING_SLOT_TYPE, VEHICLE_TYPE } from '@/constants';
import { ParkingSlotService } from '@/services/parking-slot.service';
import type { TParkingSlot } from '@/types/parking-lot.type';
import { parkingLotTableMock } from './mocks/parking-lot-table.mock';

/**
 * ParkingSlotService.findNearestAvailable depends on ParkingLotRepository's:
 * - `findParkingSlotByID` to resolve the entrance's location.
 * - `allAvailableParkingSlots` to get candidate slots (already AVAILABLE and non-entrance).
 *
 * `givenParkingLot` stubs both from one slot list, mirroring the repository's own filtering
 * (status AVAILABLE, type !== ENTRANCE), so the mock stays faithful to the real contract.
 *
 * Distance is Euclidean over `location`; ties are broken by scan order (first slot reaching
 * the lowest distance wins).
 */

type StubbedParkingSlotService = Omit<ParkingSlotService, 'parkingLotRepository'> & {
  parkingLotRepository: {
    findParkingSlotByID: ReturnType<typeof jest.fn>;
    allAvailableParkingSlots: ReturnType<typeof jest.fn>;
    updateStatus: ReturnType<typeof jest.fn>;
  };
};

const cloneSlots = (): TParkingSlot[] => JSON.parse(JSON.stringify(parkingLotTableMock));

const occupy = (slots: TParkingSlot[], ids: string[]): TParkingSlot[] => {
  const idsToOccupy = new Set(ids);

  return slots.map((slot) =>
    idsToOccupy.has(slot.id) ? { ...slot, status: PARKING_SLOT_STATUS.OCCUPIED } : slot,
  );
};

describe(ParkingSlotService.name, () => {
  let parkingSlotService: StubbedParkingSlotService;

  const givenParkingLot = (slots: TParkingSlot[]) => {
    parkingSlotService.parkingLotRepository.findParkingSlotByID.mockImplementation(
      async (id: string) => slots.find((slot) => slot.id === id) ?? null,
    );
    parkingSlotService.parkingLotRepository.allAvailableParkingSlots.mockResolvedValue(
      slots.filter(
        (slot) =>
          slot.status === PARKING_SLOT_STATUS.AVAILABLE && slot.type !== PARKING_SLOT_TYPE.ENTRANCE,
      ),
    );
  };

  beforeEach(() => {
    parkingSlotService = new ParkingSlotService() as unknown as StubbedParkingSlotService;
    parkingSlotService.parkingLotRepository = {
      findParkingSlotByID: jest.fn(),
      allAvailableParkingSlots: jest.fn(),
      updateStatus: jest.fn(),
    };

    givenParkingLot(cloneSlots());
  });

  describe('vehicle-to-slot compatibility', () => {
    it('parks a small (S) vehicle in the nearest available slot', async () => {
      const slot = await parkingSlotService.findNearestAvailable('E010002', VEHICLE_TYPE.SMALL);

      expect(slot?.id).toBe('SP010001');
    });

    it('parks a medium (M) vehicle in a medium or large slot, never a small one', async () => {
      // The overall closest slot to E010002 is SP010001, but M vehicles cannot use SP.
      const slot = await parkingSlotService.findNearestAvailable('E010002', VEHICLE_TYPE.MEDIUM);

      expect(slot?.id).toBe('MP010202');
      expect(slot?.type).not.toBe(PARKING_SLOT_TYPE.SMALL);
    });

    it('parks a large (L) vehicle in a large slot only, bypassing much closer small/medium slots', async () => {
      const slot = await parkingSlotService.findNearestAvailable('E010002', VEHICLE_TYPE.LARGE);

      expect(slot?.id).toBe('LP010401');
      expect(slot?.type).toBe(PARKING_SLOT_TYPE.LARGE);
    });

    it('never assigns a large (L) vehicle to a small or medium slot, even if every large slot is taken', async () => {
      givenParkingLot(occupy(cloneSlots(), ['LP010400', 'LP010401', 'LP010403', 'LP010404']));

      await expect(
        parkingSlotService.findNearestAvailable('E010002', VEHICLE_TYPE.LARGE),
      ).rejects.toThrow('No available parking slots for the specified vehicle type.');
    });

    it('lets a small (S) vehicle use a closer slot that a medium (M) vehicle is not allowed to use', async () => {
      // Same entrance, same layout: S can take the closer SP slot, M must skip past it to MP.
      const smallSlot = await parkingSlotService.findNearestAvailable('E010200', VEHICLE_TYPE.SMALL);
      const mediumSlot = await parkingSlotService.findNearestAvailable('E010200', VEHICLE_TYPE.MEDIUM);

      expect(smallSlot?.id).toBe('SP010100');
      expect(mediumSlot?.id).toBe('MP010201');
    });
  });

  describe('proximity to entrance', () => {
    it('returns the available slot with the shortest distance to the given entrance', async () => {
      const slot = await parkingSlotService.findNearestAvailable('E010402', VEHICLE_TYPE.SMALL);

      expect(slot?.id).toBe('MP010302');
    });

    it('falls back to the next-closest slot when the nearest one is already occupied', async () => {
      givenParkingLot(occupy(cloneSlots(), ['SP010001']));

      const slot = await parkingSlotService.findNearestAvailable('E010002', VEHICLE_TYPE.SMALL);

      expect(slot?.id).toBe('SP010003');
    });
  });

  describe('entry points', () => {
    it('throws when the given entrance ID does not exist in the parking lot', async () => {
      await expect(
        parkingSlotService.findNearestAvailable('E999999', VEHICLE_TYPE.SMALL),
      ).rejects.toThrow('Entrance with ID E999999 not found.');
    });

    it('never falls back to an entry point, even though entry points are excluded from "available" slots', async () => {
      // Occupy every non-entrance slot, leaving only entrances. allAvailableParkingSlots already
      // excludes entrances by type, so this should surface as "no available slots", not the entrance.
      const nonEntranceIds = parkingLotTableMock
        .filter((slot) => slot.type !== PARKING_SLOT_TYPE.ENTRANCE)
        .map((slot) => slot.id);
      givenParkingLot(occupy(cloneSlots(), nonEntranceIds));

      await expect(
        parkingSlotService.findNearestAvailable('E010002', VEHICLE_TYPE.SMALL),
      ).rejects.toThrow('No available parking slots for the specified vehicle type.');
    });

    it('supports at least the three entrances present in the base layout', async () => {
      const entranceIds = parkingLotTableMock
        .filter((slot) => slot.type === PARKING_SLOT_TYPE.ENTRANCE)
        .map((slot) => slot.id);

      expect(entranceIds.length).toBeGreaterThanOrEqual(3);

      for (const entranceID of entranceIds) {
        await expect(
          parkingSlotService.findNearestAvailable(entranceID, VEHICLE_TYPE.SMALL),
        ).resolves.not.toBeNull();
      }
    });

    it('supports entrances added after the initial layout, not just the original three', async () => {
      // The mall can add new entrances later; the lookup must not assume a fixed set of entrance IDs.
      givenParkingLot([
        { id: 'E020000', type: PARKING_SLOT_TYPE.ENTRANCE, status: PARKING_SLOT_STATUS.AVAILABLE, floor: 2, location: [0, 0] },
        { id: 'SP020001', type: PARKING_SLOT_TYPE.SMALL, status: PARKING_SLOT_STATUS.AVAILABLE, floor: 2, location: [0, 1] },
        { id: 'SP020010', type: PARKING_SLOT_TYPE.SMALL, status: PARKING_SLOT_STATUS.AVAILABLE, floor: 2, location: [1, 0] },
      ]);

      const slot = await parkingSlotService.findNearestAvailable('E020000', VEHICLE_TYPE.SMALL);

      expect(slot?.id).toBe('SP020001');
    });
  });

  describe('updateStatus', () => {
    it('delegates to the repository and returns the updated slot', async () => {
      const updatedSlot: TParkingSlot = {
        id: 'SP010001',
        type: PARKING_SLOT_TYPE.SMALL,
        status: PARKING_SLOT_STATUS.OCCUPIED,
        floor: 1,
        location: [0, 1],
      };
      parkingSlotService.parkingLotRepository.updateStatus.mockResolvedValue(updatedSlot);

      const slot = await parkingSlotService.updateStatus('SP010001', PARKING_SLOT_STATUS.OCCUPIED);

      expect(parkingSlotService.parkingLotRepository.updateStatus).toHaveBeenCalledWith(
        'SP010001',
        PARKING_SLOT_STATUS.OCCUPIED,
      );
      expect(slot).toBe(updatedSlot);
    });

    it('returns null when the repository cannot find the slot to update', async () => {
      parkingSlotService.parkingLotRepository.updateStatus.mockResolvedValue(null);

      const slot = await parkingSlotService.updateStatus('UNKNOWN', PARKING_SLOT_STATUS.OCCUPIED);

      expect(slot).toBeNull();
    });
  });
});
