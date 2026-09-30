import express, { type ErrorRequestHandler } from 'express';
import { scheduleRoutes } from './routes/scheduleRoutes.js';
import { searchRoutes } from './routes/searchRoutes.js';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { emailQueue } from './queue/emailQueue.js';
import { authRoutes } from './routes/authRoutes.js';
import { slackRoutes } from './routes/slackRoutes.js';

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'Internal server error' });
};

export const createApp = () => {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.get('/health', (_request, response) => response.json({ ok: true }));
  app.use('/api/schedule', scheduleRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/slack', slackRoutes);
  const bullBoardAdapter = new ExpressAdapter();
  bullBoardAdapter.setBasePath('/admin/queues');
  createBullBoard({ queues: [new BullMQAdapter(emailQueue)], serverAdapter: bullBoardAdapter });
  app.use('/admin/queues', bullBoardAdapter.getRouter());
  app.use(errorHandler);
  return app;
};
