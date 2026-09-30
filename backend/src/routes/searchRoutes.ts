import { Router } from 'express';
import { searchEmailJobs } from '../controllers/searchController.js';

export const searchRoutes = Router();
searchRoutes.get('/', searchEmailJobs);
