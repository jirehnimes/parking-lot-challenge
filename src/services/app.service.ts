import { inject, injectable } from 'inversify';
import { DatabaseService } from '@/database/database.service';
import { logClassInitialized } from '@/utils/common.util';

@injectable()
export class AppService {
  @inject(DatabaseService)
  private databaseService!: DatabaseService;

  constructor() {
    logClassInitialized(AppService.name);
  }
}
