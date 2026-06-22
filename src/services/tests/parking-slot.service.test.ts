import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PARKING_SLOT_STATUS, PARKING_SLOT_TYPE, VEHICLE_TYPE } from '@/constants/parking.constant';
import { ParkingSlotService } from '@/services/parking-slot.service';
import type { TParkingSlot } from '@/types/parking-lot.type';
import { parkingLotTableMock } from './mocks/parking-lot-table.mock';

/**
 * `findNearestAvailable` is currently an empty stub, so these tests encode the contract it
 * needs to satisfy:
 *
 * - Slots are read through an injected `parkingLotRepository` (mirrors ParkingLotService), so
 *   tests stub `parkingLotRepository.allParkingSlots()` instead of hitting a real database.
 * - Distance between an entrance and a candidate slot is Manhattan distance over `location`.
 * - Ties are broken by scan order: the first slot reaching the lowest distance wins.
 * - Entry points (type `E`) are never assignable, regardless of their status.
 * - Returns `null` when no compatible, available slot exists.
 */

type StubbedParkingSlotService = Omit<ParkingSlotService, 'parkingLotRepository'> & {
  parkingLotRepository: { allParkingSlots: ReturnType<typeof jest.fn> };
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

  const givenSlots = (slots: TParkingSlot[]) => {
    parkingSlotService.parkingLotRepository.allParkingSlots.mockResolvedValue(slots);
  };

  beforeEach(() => {
    parkingSlotService = new ParkingSlotService() as unknown as StubbedParkingSlotService;
    parkingSlotService.parkingLotRepository = { allParkingSlots: jest.fn() };

    givenSlots(cloneSlots());
  });

  describe('vehicle-to-slot compatibility', () => {
    it('parks a small (S) vehicle in the nearest available slot', async () => {
      const slot = await parkingSlotService.findNearestAvailable('E010002', VEHICLE_TYPE.SMALL);

      expect(slot?.id).toBe('SP010001');
    });

    it('parks a medium (M) vehicle in a medium or large slot, never a small one', async () => {
      // The overall closest slot to E010002 is SP010001 (distance 1), but M vehicles cannot use SP.
      const slot = await parkingSlotService.findNearestAvailable('E010002', VEHICLE_TYPE.MEDIUM);

      expect(slot?.id).toBe('MP010202');
      expect(slot?.type).not.toBe(PARKING_SLOT_TYPE.SMALL);
    });

    it('parks a large (L) vehicle in a large slot only, bypassing much closer small/medium slots', async () => {
      // Closest SP slot to E010002 is at distance 1; the nearest LP slot is at distance 5.
      const slot = await parkingSlotService.findNearestAvailable('E010002', VEHICLE_TYPE.LARGE);

      expect(slot?.id).toBe('LP010401');
      expect(slot?.type).toBe(PARKING_SLOT_TYPE.LARGE);
    });

    it('never assigns a large (L) vehicle to a small or medium slot, even if every large slot is taken', async () => {
      givenSlots(occupy(cloneSlots(), ['LP010400', 'LP010401', 'LP010403', 'LP010404']));

      const slot = await parkingSlotService.findNearestAvailable('E010002', VEHICLE_TYPE.LARGE);

      expect(slot).toBeNull();
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
      givenSlots(occupy(cloneSlots(), ['SP010001']));

      const slot = await parkingSlotService.findNearestAvailable('E010002', VEHICLE_TYPE.SMALL);

      expect(slot?.id).toBe('SP010003');
    });
  });

  describe('entry points', () => {
    it('never falls back to an entry point, even though entrances are always available', async () => {
      // Occupy every non-entrance slot. Without explicit exclusion, an entrance would otherwise
      // be returned since it is the only slot left with status AVAILABLE.
      const nonEntranceIds = parkingLotTableMock
        .filter((slot) => slot.type !== PARKING_SLOT_TYPE.ENTRANCE)
        .map((slot) => slot.id);
      givenSlots(occupy(cloneSlots(), nonEntranceIds));

      const slot = await parkingSlotService.findNearestAvailable('E010002', VEHICLE_TYPE.SMALL);

      expect(slot).toBeNull();
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
      givenSlots([
        { id: 'E020000', type: PARKING_SLOT_TYPE.ENTRANCE, status: PARKING_SLOT_STATUS.AVAILABLE, floor: 2, location: [0, 0] },
        { id: 'SP020001', type: PARKING_SLOT_TYPE.SMALL, status: PARKING_SLOT_STATUS.AVAILABLE, floor: 2, location: [0, 1] },
        { id: 'SP020010', type: PARKING_SLOT_TYPE.SMALL, status: PARKING_SLOT_STATUS.AVAILABLE, floor: 2, location: [1, 0] },
      ]);

      const slot = await parkingSlotService.findNearestAvailable('E020000', VEHICLE_TYPE.SMALL);

      expect(slot?.id).toBe('SP020001');
    });
  });
});
