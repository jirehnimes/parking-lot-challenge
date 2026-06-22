import { Router } from 'express';
import { container } from './container';
import { AppController, ParkingLotController } from './controllers';

const router = Router();
const appController = container.get(AppController);
const parkingLotController = container.get(ParkingLotController);

// Application routes
router.get('/health-check', appController.getHealthCheck);

// Parking lot routes
const PARKING_LOT_BASE_PATH = '/parking-lot';
router.get(`${PARKING_LOT_BASE_PATH}/slots`, parkingLotController.getAllParkingSlots);
router.post(`${PARKING_LOT_BASE_PATH}/park`, parkingLotController.parkCar);
router.post(`${PARKING_LOT_BASE_PATH}/unpark`, parkingLotController.unparkCar);

export { router };
