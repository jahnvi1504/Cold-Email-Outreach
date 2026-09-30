import express, { type ErrorRequestHandler } from 'express';
import { scheduleRoutes } from './routes/scheduleRoutes.js';

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'Internal server error' });
};

export const createApp = () => {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.get('/health', (_request, response) => response.json({ ok: true }));
  app.use('/api/schedule', scheduleRoutes);
  app.use(errorHandler);
  return app;
};
