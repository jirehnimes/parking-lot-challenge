import 'reflect-metadata';
import { Container } from 'inversify';
import { AppController, ParkingLotController } from './controllers';
import { DatabaseService } from './database/database.service';
import { ParkingLotModel } from './database/models/parking-lot.model';
import { ParkingLotRepository } from './database/repositories';
import { AppService, ParkingFareService, ParkingLotService, ParkingSlotService } from './services';

const container = new Container();

// Scopes:
// Request scope: A new instance will be created for each request.
// Singleton scope: A single instance will be shared across the entire application.
// Transient scope: A new instance will be created every time it is requested.

container.bind(DatabaseService).toSelf().inSingletonScope();
container.bind(AppService).toSelf().inSingletonScope();

// Parking:
container.bind(ParkingLotModel).toSelf().inSingletonScope();
container.bind(ParkingLotRepository).toSelf().inSingletonScope();
container.bind(ParkingFareService).toSelf().inSingletonScope();
container.bind(ParkingSlotService).toSelf().inSingletonScope();
container.bind(ParkingLotService).toSelf().inSingletonScope();

// Controllers:
container.bind(AppController).toSelf().inRequestScope();
container.bind(ParkingLotController).toSelf().inRequestScope();

container.get(DatabaseService);
container.get(AppService);
container.get(ParkingFareService);
container.get(ParkingSlotService);
container.get(ParkingLotService);

export { container };
