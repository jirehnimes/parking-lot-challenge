import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { app } from '@/app';
import { PARKING_SLOT_STATUS, PARKING_SLOT_TYPE, VEHICLE_TYPE } from '@/constants';

/**
 * End-to-end tests for the parking lot complex, driven entirely through HTTP, against the
 * real (in-memory) database seeded from the initial layout in `src/data/parking-lot.data.ts`:
 * a single 5x5 floor with 3 entrances (E010002 top, E010200 middle, E010402 bottom),
 * 9 small, 9 medium, and 4 large slots.
 *
 * The app's container is a process-wide singleton, so state (occupied slots, transactions)
 * persists across tests in this file. Tests are ordered so each one builds on the state left
 * by the previous ones, mirroring how the real complex would be used over time.
 */
const ENTRANCE_TOP = 'E010002';
const ENTRANCE_MIDDLE = 'E010200';
const ENTRANCE_BOTTOM = 'E010402';
const ENTRANCES = [ENTRANCE_TOP, ENTRANCE_MIDDLE, ENTRANCE_BOTTOM];

describe('Parking lot complex (e2e)', () => {
  describe('GET /parking-lot/slots — initial layout', () => {
    it('seeds the 5x5 floor with 3 entrances, 9 small, 9 medium, and 4 large slots, all available', async () => {
      const response = await request(app).get('/parking-lot/slots');

      expect(response.status).toBe(200);

      const slots = response.body.data;
      const byType = (type: PARKING_SLOT_TYPE) =>
        slots.filter((slot: { type: string }) => slot.type === type);

      expect(slots).toHaveLength(25);
      expect(byType(PARKING_SLOT_TYPE.ENTRANCE)).toHaveLength(3);
      expect(byType(PARKING_SLOT_TYPE.SMALL)).toHaveLength(9);
      expect(byType(PARKING_SLOT_TYPE.MEDIUM)).toHaveLength(9);
      expect(byType(PARKING_SLOT_TYPE.LARGE)).toHaveLength(4);
      expect(
        slots.every((slot: { status: string }) => slot.status === PARKING_SLOT_STATUS.AVAILABLE),
      ).toBe(true);

      const entranceIds = byType(PARKING_SLOT_TYPE.ENTRANCE)
        .map((slot: { id: string }) => slot.id)
        .sort();
      expect(entranceIds).toEqual([...ENTRANCES].sort());
    });
  });

  describe('POST /parking-lot/park — using each of the 3 entry points', () => {
    it('parks a car entering through the top entrance (E010002) in its nearest slot', async () => {
      const response = await request(app).post('/parking-lot/park').send({
        entranceID: ENTRANCE_TOP,
        vehicleType: VEHICLE_TYPE.SMALL,
        licensePlate: 'TOP-001',
        entryTime: new Date().toISOString(),
      });

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        entranceID: ENTRANCE_TOP,
        parkingSlotID: 'SP010001',
        licensePlate: 'TOP-001',
        vehicleType: VEHICLE_TYPE.SMALL,
        exitTime: null,
        fare: null,
      });
    });

    it('parks a car entering through the middle entrance (E010200) in its nearest slot', async () => {
      const response = await request(app).post('/parking-lot/park').send({
        entranceID: ENTRANCE_MIDDLE,
        vehicleType: VEHICLE_TYPE.SMALL,
        licensePlate: 'MID-001',
        entryTime: new Date().toISOString(),
      });

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        entranceID: ENTRANCE_MIDDLE,
        parkingSlotID: 'SP010100',
        licensePlate: 'MID-001',
      });
    });

    it('parks a car entering through the bottom entrance (E010402), routed past entrance-adjacent rows to its nearest slot', async () => {
      const response = await request(app).post('/parking-lot/park').send({
        entranceID: ENTRANCE_BOTTOM,
        vehicleType: VEHICLE_TYPE.SMALL,
        licensePlate: 'BOT-001',
        entryTime: new Date().toISOString(),
      });

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        entranceID: ENTRANCE_BOTTOM,
        parkingSlotID: 'MP010302',
        licensePlate: 'BOT-001',
      });
    });

    it('reflects all three cars as occupied slots and open transactions', async () => {
      const slotsResponse = await request(app).get('/parking-lot/slots');
      const occupiedSlotIds = slotsResponse.body.data
        .filter((slot: { status: string }) => slot.status === PARKING_SLOT_STATUS.OCCUPIED)
        .map((slot: { id: string }) => slot.id)
        .sort();
      expect(occupiedSlotIds).toEqual(['MP010302', 'SP010001', 'SP010100']);

      const transactionsResponse = await request(app).get('/parking-transaction');
      const openTransactions = transactionsResponse.body.data.filter(
        (transaction: { licensePlate: string }) =>
          ['TOP-001', 'MID-001', 'BOT-001'].includes(transaction.licensePlate),
      );
      expect(openTransactions).toHaveLength(3);
      expect(
        openTransactions.every(
          (transaction: { exitTime: null; fare: null }) =>
            transaction.exitTime === null && transaction.fare === null,
        ),
      ).toBe(true);
    });

    it('rejects a park request for a license plate that is already parked', async () => {
      const response = await request(app).post('/parking-lot/park').send({
        entranceID: ENTRANCE_MIDDLE,
        vehicleType: VEHICLE_TYPE.SMALL,
        licensePlate: 'TOP-001',
        entryTime: new Date().toISOString(),
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('A car with license plate TOP-001 is already parked.');
    });

    it('rejects a park request from an entrance that does not exist', async () => {
      const response = await request(app).post('/parking-lot/park').send({
        entranceID: 'E999999',
        vehicleType: VEHICLE_TYPE.SMALL,
        licensePlate: 'GHOST-001',
        entryTime: new Date().toISOString(),
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Entrance with ID E999999 not found.');
    });

    it('rejects a park request that is missing a required field', async () => {
      const response = await request(app).post('/parking-lot/park').send({
        entranceID: ENTRANCE_TOP,
        vehicleType: VEHICLE_TYPE.SMALL,
        entryTime: new Date().toISOString(),
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'licensePlate' })]),
      );
    });
  });

  describe('POST /parking-lot/unpark — closing out a transaction', () => {
    it('unparks a car, charges the flat rate, and frees its slot for reuse', async () => {
      const response = await request(app).post('/parking-lot/unpark').send({
        licensePlate: 'TOP-001',
      });

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        licensePlate: 'TOP-001',
        parkingSlotID: 'SP010001',
        fare: 40,
      });
      expect(response.body.data.exitTime).not.toBeNull();

      const slotsResponse = await request(app).get('/parking-lot/slots');
      const slot = slotsResponse.body.data.find((s: { id: string }) => s.id === 'SP010001');
      expect(slot.status).toBe(PARKING_SLOT_STATUS.AVAILABLE);
    });

    it('charges the excess hourly rate once a car has stayed beyond the 3-hour flat-rate window', async () => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

      await request(app).post('/parking-lot/park').send({
        entranceID: ENTRANCE_TOP,
        vehicleType: VEHICLE_TYPE.SMALL,
        licensePlate: 'TOP-002',
        entryTime: sixHoursAgo,
      });

      const response = await request(app).post('/parking-lot/unpark').send({
        licensePlate: 'TOP-002',
      });

      expect(response.status).toBe(200);
      // Just over 6 hours elapses by the time this request is processed, so the
      // fractional excess rounds up to 7 billed hours: 40 flat + (7 - 3) * 20 excess.
      expect(response.body.data.fare).toBe(120);
    });

    it('rejects an unpark request for a license plate with no active transaction', async () => {
      const response = await request(app).post('/parking-lot/unpark').send({
        licensePlate: 'NEVER-PARKED',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        'No active parking transaction found for license plate NEVER-PARKED',
      );
    });
  });

  describe('Full complex — the 3 entry points combine to exhaust and free capacity', () => {
    it('fills every remaining slot across the complex via round-robin entry points, then rejects further cars', async () => {
      const beforeResponse = await request(app).get('/parking-lot/slots');
      const availableBefore = beforeResponse.body.data.filter(
        (slot: { status: string; type: string }) =>
          slot.status === PARKING_SLOT_STATUS.AVAILABLE && slot.type !== PARKING_SLOT_TYPE.ENTRANCE,
      ).length;

      for (let i = 0; i < availableBefore; i++) {
        const response = await request(app)
          .post('/parking-lot/park')
          .send({
            entranceID: ENTRANCES[i % ENTRANCES.length],
            vehicleType: VEHICLE_TYPE.SMALL,
            licensePlate: `FILL-${i}`,
            entryTime: new Date().toISOString(),
          });

        expect(response.status).toBe(200);
      }

      const fullResponse = await request(app).get('/parking-lot/slots');
      const nonEntranceSlots = fullResponse.body.data.filter(
        (slot: { type: string }) => slot.type !== PARKING_SLOT_TYPE.ENTRANCE,
      );
      const entranceSlots = fullResponse.body.data.filter(
        (slot: { type: string }) => slot.type === PARKING_SLOT_TYPE.ENTRANCE,
      );
      expect(
        nonEntranceSlots.every(
          (slot: { status: string }) => slot.status === PARKING_SLOT_STATUS.OCCUPIED,
        ),
      ).toBe(true);
      expect(
        entranceSlots.every(
          (slot: { status: string }) => slot.status === PARKING_SLOT_STATUS.AVAILABLE,
        ),
      ).toBe(true);

      const overflowResponse = await request(app).post('/parking-lot/park').send({
        entranceID: ENTRANCE_TOP,
        vehicleType: VEHICLE_TYPE.SMALL,
        licensePlate: 'OVERFLOW-001',
        entryTime: new Date().toISOString(),
      });

      expect(overflowResponse.status).toBe(400);
      expect(overflowResponse.body.error).toBe(
        'No available parking slots for the specified vehicle type.',
      );
    });

    it('accepts a new car once a previously parked one leaves, freeing up a slot', async () => {
      const unparkResponse = await request(app).post('/parking-lot/unpark').send({
        licensePlate: 'FILL-0',
      });
      expect(unparkResponse.status).toBe(200);

      const parkResponse = await request(app).post('/parking-lot/park').send({
        entranceID: ENTRANCE_MIDDLE,
        vehicleType: VEHICLE_TYPE.SMALL,
        licensePlate: 'NEW-001',
        entryTime: new Date().toISOString(),
      });

      expect(parkResponse.status).toBe(200);
      expect(parkResponse.body.data.licensePlate).toBe('NEW-001');
    });
  });
});
