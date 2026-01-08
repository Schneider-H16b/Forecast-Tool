import express from 'express';
import cors from 'cors';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let helmet: any;
import healthRouter from './routes/health';
import { planningRouter } from './routes/planning';
import { autoPlanRouter } from './routes/autoplan';
import { dashboardRouter } from './routes/dashboard';
import { ordersRouter } from './routes/orders';
import { settingsRouter } from './routes/settings';
import importRouter from './routes/import';
import { dbRouter } from './routes/db';
import { initDB } from './db/db';

if (process.env.NODE_ENV !== 'test') {
  // dynamically require helmet to avoid test-time Vite resolution issues
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  helmet = require('helmet');
}

const app = express();

// Initialize database (except in test environment)
if (process.env.NODE_ENV !== 'test') {
  initDB().catch(console.error);
}

if (process.env.NODE_ENV !== 'test') {
  app.use(helmet());
}
app.use(cors());
app.use(express.json());

app.use('/health', healthRouter);
app.use('/api', planningRouter);
app.use('/api', autoPlanRouter);
app.use('/api', dashboardRouter);
app.use('/api', ordersRouter);
app.use('/api', settingsRouter);
app.use('/api/import', importRouter);
app.use('/api', dbRouter);

// Generic error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'InternalServerError' });
});

export default app;
