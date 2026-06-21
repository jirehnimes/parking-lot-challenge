import type { Request, Response } from 'express';

export class AppController {
  getHealthCheck(request: Request, response: Response) {
    response.json({ status: 'ok' });
  }
}
