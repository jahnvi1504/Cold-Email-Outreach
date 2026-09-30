import { prisma } from '../db/client.js';
import { ensureSenders } from './senderService.js';

export const getRequestUser = async (email = 'demo@example.com') => {
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: email.split('@')[0] ?? 'Demo User' }
  });
  await ensureSenders(user.id);
  return user;
};
