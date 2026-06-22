import type { Response } from 'express';
import { HTTP_STATUS_CODE } from '@/constants/common.constant';

/**
 * Log a message indicating that a class has been initialized.
 * @param name Class name.
 * @returns Formatted log message.
 */
export const logClassInitialized = (name: string) => console.log(`${name} initialized`);

export const setBadRequestResponse = (response: Response, error: Error) => {
  response.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ error: error.message });
};

/**
 * Bind every method on an instance's prototype to that instance, so methods keep their `this`
 * context when passed around as callbacks (e.g. as Express route handlers).
 * @param instance The class instance whose prototype methods should be bound.
 */
export const autoBindMethods = <T extends object>(instance: T): void => {
  const prototype = Object.getPrototypeOf(instance) as T;

  for (const key of Object.getOwnPropertyNames(prototype) as Array<keyof T>) {
    if (key === 'constructor') continue;

    const value = instance[key];

    if (typeof value === 'function') {
      instance[key] = value.bind(instance);
    }
  }
};

/**
 * Compute distance between two points in a 2D space using the Euclidean distance formula.
 * @param location1 The coordinates of the first point as a tuple [x1, y1].
 * @param location2 The coordinates of the second point as a tuple [x2, y2].
 * @returns The Euclidean distance between the two points.
 */
export const computeDistance = (
  location1: [number, number],
  location2: [number, number],
): number => {
  const [x1, y1] = location1;
  const [x2, y2] = location2;

  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};
