import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PARKING_SLOT_TYPE } from '@/constants/parking.constant';
import { ParkingFareService } from '@/services/parking-fare.service';

const NOW = new Date('2024-01-01T00:00:00.000Z');

const entryTimeHoursAgo = (hours: number): Date => {
  return new Date(NOW.getTime() - hours * 60 * 60 * 1000);
}

describe(ParkingFareService.name, () => {
  let parkingFareService: ParkingFareService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    parkingFareService = new ParkingFareService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('flat rate for the first 3 hours', () => {
    it('charges 40 pesos for a 1 hour stay', () => {
      expect(parkingFareService.calculateFare(PARKING_SLOT_TYPE.SMALL, entryTimeHoursAgo(1))).toBe(
        40,
      );
    });

    it('charges 40 pesos for exactly 3 hours', () => {
      expect(parkingFareService.calculateFare(PARKING_SLOT_TYPE.SMALL, entryTimeHoursAgo(3))).toBe(
        40,
      );
    });

    it('charges 40 pesos regardless of slot size', () => {
      expect(parkingFareService.calculateFare(PARKING_SLOT_TYPE.MEDIUM, entryTimeHoursAgo(3))).toBe(
        40,
      );
      expect(parkingFareService.calculateFare(PARKING_SLOT_TYPE.LARGE, entryTimeHoursAgo(3))).toBe(
        40,
      );
    });

    it('rounds up a 2.5 hour stay to 3 hours and charges the flat rate', () => {
      expect(
        parkingFareService.calculateFare(PARKING_SLOT_TYPE.SMALL, entryTimeHoursAgo(2.5)),
      ).toBe(40);
    });
  });

  describe('excess hourly rate beyond the initial 3 hours', () => {
    it('charges 20/hour excess for a slot SP', () => {
      // 4 hours = 40 flat + (4 - 3) * 20
      expect(parkingFareService.calculateFare(PARKING_SLOT_TYPE.SMALL, entryTimeHoursAgo(4))).toBe(
        60,
      );
    });

    it('charges 60/hour excess for a slot MP', () => {
      // 4 hours = 40 flat + (4 - 3) * 60
      expect(parkingFareService.calculateFare(PARKING_SLOT_TYPE.MEDIUM, entryTimeHoursAgo(4))).toBe(
        100,
      );
    });

    it('charges 100/hour excess for a slot LP', () => {
      // 4 hours = 40 flat + (4 - 3) * 100
      expect(parkingFareService.calculateFare(PARKING_SLOT_TYPE.LARGE, entryTimeHoursAgo(4))).toBe(
        140,
      );
    });

    it('rounds up a 6.5 hour stay to 7 hours before applying the excess rate', () => {
      // 7 hours = 40 flat + (7 - 3) * 20
      expect(
        parkingFareService.calculateFare(PARKING_SLOT_TYPE.SMALL, entryTimeHoursAgo(6.5)),
      ).toBe(120);
    });
  });

  describe('full 24 hour chunks', () => {
    it('charges a flat 5000 pesos for exactly 24 hours, regardless of slot size', () => {
      expect(parkingFareService.calculateFare(PARKING_SLOT_TYPE.SMALL, entryTimeHoursAgo(24))).toBe(
        5000,
      );
      expect(parkingFareService.calculateFare(PARKING_SLOT_TYPE.LARGE, entryTimeHoursAgo(24))).toBe(
        5000,
      );
    });

    it('charges 2 full chunks of 5000 for exactly 48 hours', () => {
      expect(parkingFareService.calculateFare(PARKING_SLOT_TYPE.SMALL, entryTimeHoursAgo(48))).toBe(
        10000,
      );
    });

    it('charges the flat rate for a remainder of 3 hours or less', () => {
      // 1 chunk of 24h (5000) + 3 remainder hours (40 flat)
      expect(parkingFareService.calculateFare(PARKING_SLOT_TYPE.SMALL, entryTimeHoursAgo(27))).toBe(
        5040,
      );
    });

    it('charges the flat rate plus excess hourly rate for a remainder beyond 3 hours', () => {
      // 1 chunk of 24h (5000) + 6 remainder hours (40 flat + (6 - 3) * 20 for SP)
      expect(parkingFareService.calculateFare(PARKING_SLOT_TYPE.SMALL, entryTimeHoursAgo(30))).toBe(
        5100,
      );
      // 1 chunk of 24h (5000) + 6 remainder hours (40 flat + (6 - 3) * 60 for MP)
      expect(
        parkingFareService.calculateFare(PARKING_SLOT_TYPE.MEDIUM, entryTimeHoursAgo(30)),
      ).toBe(5220);
      // 1 chunk of 24h (5000) + 6 remainder hours (40 flat + (6 - 3) * 100 for LP)
      expect(parkingFareService.calculateFare(PARKING_SLOT_TYPE.LARGE, entryTimeHoursAgo(30))).toBe(
        5340,
      );
    });

    it('rounds up before splitting into 24 hour chunks', () => {
      // 24.5h rounds up to 25h = 1 chunk of 24h (5000) + 1 remainder hour (40 flat)
      expect(
        parkingFareService.calculateFare(PARKING_SLOT_TYPE.SMALL, entryTimeHoursAgo(24.5)),
      ).toBe(5040);
    });
  });

});
