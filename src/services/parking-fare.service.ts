import { PARKING_SLOT_TYPE } from '@/constants';
import { logClassInitialized } from '@/utils/common.util';
import { countFullDaysFromHours, differenceInHours } from '@/utils/date.util';

// Timezone is not considered in this implementation since the parking system is assumed to be used in a single timezone.
export class ParkingFareService {
  // Hours
  FLAT_RATE_HOURS = 3;
  FULL_DAY_HOURS = 24;
  // Rates
  FLAT_RATE = 40;
  SMALL_EXCESS_RATE = 20;
  MEDIUM_EXCESS_RATE = 60;
  LARGE_EXCESS_RATE = 100;
  FULL_DAY_RATE = 5000;

  constructor() {
    logClassInitialized(ParkingFareService.name);
  }

  calculateFare(parkingSlotType: PARKING_SLOT_TYPE, entryTime: Date): number {
    // Compute difference in hours then round up.
    const timeDifference = Math.ceil(differenceInHours(new Date(), entryTime));

    // If the time difference is less than or equal to the flat rate hours, return the flat rate immediately.
    if (timeDifference <= this.FLAT_RATE_HOURS) {
      return this.FLAT_RATE;
    }

    // If the time difference exceeds the flat rate hours, compute for the excess hours and full days.
    return this.computeExceedFlatRate(parkingSlotType, timeDifference);
  }

  private computeExceedFlatRate(parkingSlotType: PARKING_SLOT_TYPE, timeDifference: number): number {
    let computedFare = 0;

    computedFare += this.computeExceedFullDay(timeDifference);
    computedFare += this.computeExceedHours(parkingSlotType, timeDifference);

    return computedFare;
  }

  private computeExceedFullDay(timeDifference: number): number {
    let computedFare = 0;
    const computedFullDays = countFullDaysFromHours(timeDifference, this.FULL_DAY_HOURS);

    if (computedFullDays >= 1) {
      computedFare += this.FULL_DAY_RATE * computedFullDays;
    }

    return computedFare;
  }

  private computeExceedHours(parkingSlotType: PARKING_SLOT_TYPE, timeDifference: number): number {
    // If there are full days, remove first in the timeDifference.
    // Compute for the exceeding hours.
    let computedFare = 0;
    let computedHours = this.computeRemainingHoursPerDay(timeDifference);

    if (computedHours <= 0) {
      return computedFare;
    }

    // Automatically add the flat rate since the time difference already exceeds the flat rate hours.
    computedFare += this.FLAT_RATE;

    // If the computed hours exceed the flat rate hours, compute for the excess hours.
    if (computedHours > this.FLAT_RATE_HOURS) {
      computedHours = computedHours - this.FLAT_RATE_HOURS;

      if (parkingSlotType === PARKING_SLOT_TYPE.SMALL) {
        computedFare += computedHours * this.SMALL_EXCESS_RATE;
      } else if (parkingSlotType === PARKING_SLOT_TYPE.MEDIUM) {
        computedFare += computedHours * this.MEDIUM_EXCESS_RATE;
      } else if (parkingSlotType === PARKING_SLOT_TYPE.LARGE) {
        computedFare += computedHours * this.LARGE_EXCESS_RATE;
      }
    }

    return computedFare;
  }

  private computeRemainingHoursPerDay(timeDifference: number): number {
    if (timeDifference >= this.FULL_DAY_HOURS) {
      const computedFullDays = countFullDaysFromHours(timeDifference, this.FULL_DAY_HOURS);
      const computedFullDaysInHours = computedFullDays * this.FULL_DAY_HOURS;

      return timeDifference - computedFullDaysInHours;
    }

    return timeDifference;
  }
}
