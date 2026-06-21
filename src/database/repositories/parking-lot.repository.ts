import { injectable } from 'inversify';
import type { Repository } from './repository';

@injectable()
export class ParkingLotRepository<T> implements Repository<T> {
  constructor() {
    console.log('ParkingLotRepository initialized');
  }

  create(item: T): Promise<T> {
    throw new Error('Method not implemented.');
  }

  update(id: string, item: Partial<T>): Promise<T | null> {
    throw new Error('Method not implemented.');
  }

  delete(id: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  findById(id: string): Promise<T | null> {
    throw new Error('Method not implemented.');
  }

  findAll(): Promise<T[]> {
    throw new Error('Method not implemented.');
  }
}
