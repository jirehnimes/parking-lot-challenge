import 'reflect-metadata';
import express from 'express';
import helmet from 'helmet';
import { router } from './routes';

const app = express();

app.use(helmet());
app.use(express.json());
app.use(router);

export { app };
