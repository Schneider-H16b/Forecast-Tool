import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRouter from './routes/health';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/health', healthRouter);

// Generic error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: 'InternalServerError' });
});

export default app;
