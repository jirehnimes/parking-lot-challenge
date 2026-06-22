import 'reflect-metadata';
import { Container } from 'inversify';
import { AppController, ParkingLotController, ParkingTransactionController } from './controllers';
import { DatabaseService } from './database/database.service';
import { ParkingLotModel, ParkingTransactionModel } from './database/models';
import { ParkingLotRepository, ParkingTransactionRepository } from './database/repositories';
import { AppService, ParkingFareService, ParkingLotService, ParkingSlotService } from './services';
import { ParkingTransactionService } from './services/parking-transaction.service';

const container = new Container();

// Scopes:
// Request scope: A new instance will be created for each request.
// Singleton scope: A single instance will be shared across the entire application.
// Transient scope: A new instance will be created every time it is requested.

container.bind(DatabaseService).toSelf().inSingletonScope();
container.bind(AppService).toSelf().inSingletonScope();

// Parking:
container.bind(ParkingLotModel).toSelf().inSingletonScope();
container.bind(ParkingTransactionModel).toSelf().inSingletonScope();
container.bind(ParkingLotRepository).toSelf().inSingletonScope();
container.bind(ParkingTransactionRepository).toSelf().inSingletonScope();
container.bind(ParkingFareService).toSelf().inSingletonScope();
container.bind(ParkingSlotService).toSelf().inSingletonScope();
container.bind(ParkingLotService).toSelf().inSingletonScope();
container.bind(ParkingTransactionService).toSelf().inSingletonScope();

// Controllers:
container.bind(AppController).toSelf().inRequestScope();
container.bind(ParkingLotController).toSelf().inRequestScope();
container.bind(ParkingTransactionController).toSelf().inRequestScope();

container.get(DatabaseService);
container.get(AppService);
container.get(ParkingFareService);
container.get(ParkingSlotService);
container.get(ParkingLotService);

export { container };
