import { Router } from 'express';
import { container } from './container';
import { AppController, ParkingLotController, ParkingTransactionController } from './controllers';

const router = Router();
const appController = container.get(AppController);
const parkingLotController = container.get(ParkingLotController);
const parkingTransactionController = container.get(ParkingTransactionController);

// Application routes
router.get('/health-check', appController.getHealthCheck);

// Parking lot routes
const PARKING_LOT_BASE_PATH = '/parking-lot';
router.get(`${PARKING_LOT_BASE_PATH}/slots`, parkingLotController.getAllParkingSlots);
router.post(`${PARKING_LOT_BASE_PATH}/park`, parkingLotController.parkCar);
router.post(`${PARKING_LOT_BASE_PATH}/unpark`, parkingLotController.unparkCar);

// Parking transaction routes
const PARKING_TRANSACTION_BASE_PATH = '/parking-transaction';
router.get(PARKING_TRANSACTION_BASE_PATH, parkingTransactionController.getAllParkingTransactions);

export { router };
