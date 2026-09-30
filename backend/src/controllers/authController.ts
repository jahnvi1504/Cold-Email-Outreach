import { env } from '../config/env.js';
import { createSessionToken, sessionCookie, upsertGoogleUser, verifySessionToken } from '../services/authService.js';
import { prisma } from '../db/client.js';

const googleScope = encodeURIComponent('openid email profile');

export const googleLogin = (_request: any, response: any) => {
  if (!env.GOOGLE_CLIENT_ID) return response.status(503).json({ error: 'Google OAuth is not configured' });
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(env.GOOGLE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(env.GOOGLE_CALLBACK_URL)}&response_type=code&scope=${googleScope}&access_type=offline`;
  return response.redirect(url);
};

export const googleCallback = async (request: any, response: any, next: any) => {
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code: String(request.query.code), client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: env.GOOGLE_CALLBACK_URL, grant_type: 'authorization_code' }) });
    const tokens = await tokenResponse.json() as { access_token?: string };
    if (!tokens.access_token) throw new Error('Google token exchange failed');
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    const profile = await profileResponse.json() as { sub: string; email: string; name?: string; picture?: string };
    const user = await upsertGoogleUser(profile);
    response.setHeader('Set-Cookie', sessionCookie(createSessionToken(user.id)));
    return response.redirect(env.FRONTEND_URL);
  } catch (error) {
    return next(error);
  }
};

export const currentUser = async (request: any, response: any, next: any) => {
  try {
    const token = request.headers.cookie?.split(';').map((part: string) => part.trim()).find((part: string) => part.startsWith('reachinbox_session='))?.split('=')[1];
    if (!token) return response.status(401).json({ error: 'Authentication required' });
    const user = await prisma.user.findUnique({ where: { id: verifySessionToken(token).userId }, select: { id: true, email: true, name: true, avatarUrl: true } });
    return user ? response.json(user) : response.status(401).json({ error: 'User not found' });
  } catch (error) {
    return next(error);
  }
};

export const logout = (_request: any, response: any) => {
  response.setHeader('Set-Cookie', 'reachinbox_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  return response.status(204).send();
};
