import { Worker } from 'bullmq';
import { prisma } from '../db/client.js';
import { env } from '../config/env.js';
import { EMAIL_QUEUE_NAME } from '../queue/emailQueue.js';
import { redis } from '../queue/connection.js';
import { sendEmail } from '../services/senderService.js';
import { reserveSendSlot } from '../services/rateLimitService.js';
import { indexEmail } from '../services/searchService.js';
import { notifyRateLimit } from '../services/slackService.js';

export const emailWorker = new Worker(EMAIL_QUEUE_NAME, async (job) => {
  const emailId = String(job.data.emailId);
  const pendingEmail = await prisma.emailJob.findUnique({ where: { id: emailId }, include: { sender: true, user: true } });
  if (!pendingEmail || pendingEmail.status !== 'scheduled' || !pendingEmail.sender) return;
  const slot = await reserveSendSlot(pendingEmail.sender, pendingEmail.hourlyLimit ?? undefined);
  if (!slot.allowed) {
    if (slot.reason === 'hourly-limit') await notifyRateLimit(pendingEmail.userId, pendingEmail.sender.email, slot.retryAt);
    await job.moveToDelayed(slot.retryAt, job.token);
    return;
  }
  const claimed = await prisma.emailJob.updateMany({
    where: { id: emailId, status: 'scheduled' },
    data: { status: 'processing', attempts: { increment: 1 } }
  });
  if (claimed.count === 0) return;
  const email = await prisma.emailJob.findUnique({ where: { id: emailId }, include: { sender: true } });
  if (!email?.sender) throw new Error('Email sender is unavailable');
  try {
    await sendEmail(email.sender, email.recipient, email.subject, email.body);
    const sent = await prisma.emailJob.update({ where: { id: emailId }, data: { status: 'sent', processedAt: new Date() } });
    await indexEmail(sent);
  } catch (error) {
    await prisma.emailJob.update({ where: { id: emailId }, data: { status: 'scheduled', lastError: error instanceof Error ? error.message : String(error) } });
    throw error;
  }
}, { connection: redis, concurrency: env.WORKER_CONCURRENCY });

emailWorker.on('failed', async (job, error) => {
  if (!job || job.attemptsMade < (job.opts.attempts ?? 1)) return;
  const failed = await prisma.emailJob.update({
    where: { id: String(job.data.emailId) },
    data: { status: 'failed', processedAt: new Date(), lastError: error.message }
  });
  await indexEmail(failed);
});
