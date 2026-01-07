import express from 'express';
import cors from 'cors';
let helmet: any;
import healthRouter from './routes/health';

if (process.env.NODE_ENV !== 'test') {
  // dynamically require helmet to avoid test-time Vite resolution issues
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  helmet = require('helmet');
}

const app = express();

if (process.env.NODE_ENV !== 'test') {
  app.use(helmet());
}
app.use(cors());
app.use(express.json());

app.use('/health', healthRouter);

// Generic error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'InternalServerError' });
});

export default app;
