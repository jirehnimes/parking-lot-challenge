import { inject, injectable } from 'inversify';
import { ParkingLotRepository } from '@/database/repositories';

@injectable()
export class ParkingLotService {
  @inject(ParkingLotRepository)
  private parkingLotRepository!: ParkingLotRepository<any>;

  parkCar(): string {
    return 'hahahaha';
  }

  unparkCar(): void {}
}
