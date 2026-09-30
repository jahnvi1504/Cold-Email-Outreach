import { Router } from 'express';
import { currentUser, googleCallback, googleLogin, logout } from '../controllers/authController.js';

export const authRoutes = Router();
authRoutes.get('/google', googleLogin);
authRoutes.get('/google/callback', googleCallback);
authRoutes.get('/me', currentUser);
authRoutes.post('/logout', logout);
