/**
 * Log a message indicating that a class has been initialized.
 * @param name Class name.
 * @returns Formatted log message.
 */
export const logClassInitialized = (name: string) => console.log(`${name} initialized`);

/**
 * Compute distance between two points in a 2D space using the Euclidean distance formula.
 * @param location1 The coordinates of the first point as a tuple [x1, y1].
 * @param location2 The coordinates of the second point as a tuple [x2, y2].
 * @returns The Euclidean distance between the two points.
 */
export const computeDistance = (location1: [number, number], location2: [number, number]): number => {
  const [x1, y1] = location1;
  const [x2, y2] = location2;

  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
