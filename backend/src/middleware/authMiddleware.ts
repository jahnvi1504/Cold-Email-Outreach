import type { RequestHandler } from 'express';
import { verifySessionToken } from '../services/authService.js';

export const requireAuth: RequestHandler = (request, response, next) => {
  const token = request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('reachinbox_session='))?.split('=')[1];
  if (!token) return response.status(401).json({ error: 'Authentication required' });
  try {
    (request as any).userId = verifySessionToken(token).userId;
    return next();
  } catch {
    return response.status(401).json({ error: 'Invalid session' });
  }
};
