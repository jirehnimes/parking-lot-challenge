/**
 * Compute the difference in hours between two dates.
 * The result can be a decimal number, which represents the fraction of an hour.
 * @param dateLeft The later date
 * @param dateRight The earlier date
 * @returns The difference in hours
 */
export const differenceInHours = (dateLeft: Date, dateRight: Date): number => {
  const diff = dateLeft.getTime() - dateRight.getTime();
  return diff / (1000 * 60 * 60);
}

/**
 * Count the number of full days from the given hours. By default, a full day is considered as 24 hours.
 * @param hours Given hours
 * @param fullDayHours Number of hours considered as a full day
 * @returns Number of full days
 */
export const countFullDaysFromHours = (hours: number, fullDayHours = 24): number => {
  return Math.floor(hours / fullDayHours);
}
