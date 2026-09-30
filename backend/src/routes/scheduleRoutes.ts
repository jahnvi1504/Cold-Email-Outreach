import { Router } from 'express';
import { listScheduledEmails, listSentEmails, scheduleEmails } from '../controllers/scheduleController.js';

export const scheduleRoutes = Router();
scheduleRoutes.post('/', scheduleEmails);
scheduleRoutes.get('/scheduled', listScheduledEmails);
scheduleRoutes.get('/sent', listSentEmails);
