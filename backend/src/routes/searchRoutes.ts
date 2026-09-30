import { Router } from 'express';
import { searchEmailJobs } from '../controllers/searchController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const searchRoutes = Router();
searchRoutes.get('/', requireAuth, searchEmailJobs);
