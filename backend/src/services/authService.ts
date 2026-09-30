import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../db/client.js';

type Session = { userId: string };

export const createSessionToken = (userId: string) => jwt.sign({ userId } satisfies Session, env.JWT_SECRET, { expiresIn: '7d' });
export const verifySessionToken = (token: string) => jwt.verify(token, env.JWT_SECRET) as Session;

export const sessionCookie = (token: string) => `reachinbox_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800${env.NODE_ENV === 'production' ? '; Secure' : ''}`;

export const upsertGoogleUser = async (profile: { sub: string; email: string; name?: string; picture?: string }) => prisma.user.upsert({
  where: { email: profile.email },
  update: { googleId: profile.sub, name: profile.name ?? profile.email, avatarUrl: profile.picture },
  create: { googleId: profile.sub, email: profile.email, name: profile.name ?? profile.email, avatarUrl: profile.picture }
});
