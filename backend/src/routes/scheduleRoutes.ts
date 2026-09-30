import { Router } from 'express';
import { listScheduledEmails, listSentEmails, scheduleEmails } from '../controllers/scheduleController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const scheduleRoutes = Router();
scheduleRoutes.use(requireAuth);
scheduleRoutes.post('/', scheduleEmails);
scheduleRoutes.get('/scheduled', listScheduledEmails);
scheduleRoutes.get('/sent', listSentEmails);
