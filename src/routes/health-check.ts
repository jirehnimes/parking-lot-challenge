import { Router } from 'express';

const healthCheckRouter = Router();

healthCheckRouter.get('/health-check', (_req, res) => {
  res.json({ status: 'ok' });
});

export { healthCheckRouter };
