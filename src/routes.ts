import { Router } from 'express';
import { container } from './container';
import { AppController, ParkingLotController } from './controllers';

const router = Router();
const appController = new AppController();
const parkingLotController = container.get(ParkingLotController);

router.get('/health-check', appController.getHealthCheck);
router.get('/foo', parkingLotController.foo);

export { router };
