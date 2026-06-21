import { differenceInHours } from 'date-fns';
import { PARKING_SLOT_TYPE } from '@/constants/parking.constant';

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

  calculateFare(parkingSlotType: PARKING_SLOT_TYPE, entryTime: Date): number {
    console.log({parkingSlotType, entryTime});

    // Compute difference in hours then round up.
    const timeDifference = Math.ceil(differenceInHours(new Date(), entryTime));

    if (timeDifference <= this.FLAT_RATE_HOURS) {
      return this.FLAT_RATE;
    }

    return this.computeExceedFlatRate(parkingSlotType, timeDifference);
  }

  private computeExceedFlatRate(parkingSlotType: PARKING_SLOT_TYPE, timeDifference: number): number {
    let computedFare = this.FLAT_RATE;

    computedFare += this.computeExceedFullDay(timeDifference);
    computedFare += this.computeExceedHours(parkingSlotType, timeDifference);

    return computedFare;
  }

  private computeExceedFullDay(timeDifference: number): number {
    let computedFare = 0;
    const computedFullDays = Math.floor(timeDifference / this.FULL_DAY_HOURS);

    if (computedFullDays > 1) {
      computedFare += this.FULL_DAY_RATE * computedFullDays;
    }

    return computedFare;
  }

  private computeExceedHours(parkingSlotType: PARKING_SLOT_TYPE, timeDifference: number): number {
    // If there are full days, remove first in the timeDifference.
    // Compute for the exceeding hours.
    let computedFare = 0;
    let computedHours = timeDifference;
    const computedFullDaysInHours = Math.floor(timeDifference / this.FULL_DAY_HOURS) * this.FULL_DAY_HOURS;

    if (computedFullDaysInHours > 0) {
      computedHours -= computedFullDaysInHours;
    }

    if (timeDifference <= this.FLAT_RATE_HOURS) {
      return this.FLAT_RATE;
    }

    computedHours = computedHours - this.FLAT_RATE_HOURS;

    if (parkingSlotType === PARKING_SLOT_TYPE.SMALL) {
      computedFare += computedHours * this.SMALL_EXCESS_RATE;
    } else if (parkingSlotType === PARKING_SLOT_TYPE.MEDIUM) {
      computedFare += computedHours * this.MEDIUM_EXCESS_RATE;
    } else if (parkingSlotType === PARKING_SLOT_TYPE.LARGE) {
      computedFare += computedHours * this.LARGE_EXCESS_RATE;
    }

    return computedFare;
  }
}
