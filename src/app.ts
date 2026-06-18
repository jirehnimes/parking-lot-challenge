import 'reflect-metadata';
import express from 'express';
import helmet from 'helmet';
import { healthCheckRouter } from './routes/health-check';

const app = express();

app.use(helmet());
app.use(express.json());
app.use(healthCheckRouter);

export { app };
