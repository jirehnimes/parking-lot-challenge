import 'reflect-metadata';
import { Container } from 'inversify';
import { ParkingLotController } from './controllers';
import { ParkingLotRepository } from './database/repositories';
import { MockDatabaseService } from './services/mock-database.service';
import { ParkingLotService } from './services/parking-lot.service';

const container = new Container();

// Scopes:
// Request scope: A new instance will be created for each request.
// Singleton scope: A single instance will be shared across the entire application.
// Transient scope: A new instance will be created every time it is requested.

container.bind(MockDatabaseService).toSelf().inSingletonScope();

// Repositories:
container.bind(ParkingLotRepository).toSelf().inSingletonScope();

// Modules:
container.bind(ParkingLotService).toSelf().inRequestScope();
container.bind(ParkingLotController).toSelf().inRequestScope();

export { container };
