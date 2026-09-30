import { Router } from 'express';
import { slackCallback, slackConnect, slackDisconnect } from '../controllers/slackController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const slackRoutes = Router();
slackRoutes.get('/connect', requireAuth, slackConnect);
slackRoutes.get('/callback', slackCallback);
slackRoutes.delete('/', requireAuth, slackDisconnect);
