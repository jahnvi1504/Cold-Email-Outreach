import type { Sender } from '@prisma/client';
import { env } from '../config/env.js';
import { redis } from '../queue/connection.js';

const hourWindow = () => Math.floor(Date.now() / 3_600_000);

export const reserveSendSlot = async (sender: Sender, requestedLimit?: number) => {
  const limit = requestedLimit ?? env.MAX_EMAILS_PER_HOUR_PER_SENDER;
  const window = hourWindow();
  const counterKey = `email-rate:${sender.id}:${window}`;
  const nextSendKey = `email-next-send:${sender.id}`;
  const now = Date.now();
  const nextAllowed = Number(await redis.get(nextSendKey) ?? 0);
  if (nextAllowed > now) return { allowed: false, retryAt: nextAllowed, reason: 'delay' as const };

  const count = await redis.incr(counterKey);
  if (count === 1) await redis.expire(counterKey, 3_700);
  if (count > limit) {
    await redis.decr(counterKey);
    return { allowed: false, retryAt: (window + 1) * 3_600_000, reason: 'hourly-limit' as const };
  }
  await redis.set(nextSendKey, String(now + env.MIN_DELAY_BETWEEN_EMAILS_MS), 'PX', env.MIN_DELAY_BETWEEN_EMAILS_MS + 60_000);
  return { allowed: true as const };
};
