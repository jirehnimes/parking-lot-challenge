import type { Request, Response } from 'express';
import { injectable } from 'inversify';
import { autoBindMethods, logClassInitialized } from '@/utils/common.util';

@injectable()
export class AppController {
  constructor() {
    autoBindMethods(this);

    logClassInitialized(AppController.name);
  }

  getHealthCheck(request: Request, response: Response) {
    response.json({ status: 'ok' });
  }
}
