import { z } from 'zod';
import { prisma } from '../db/client.js';
import { emailQueue } from '../queue/emailQueue.js';
import { env } from '../config/env.js';
import { getRequestUser } from '../services/userService.js';

const scheduleSchema = z.object({
  subject: z.string().min(1).max(500),
  body: z.string().min(1),
  recipients: z.array(z.string().email()).min(1).max(10000),
  startTime: z.coerce.date(),
  delayBetweenEmails: z.number().int().nonnegative().default(env.MIN_DELAY_BETWEEN_EMAILS_MS),
  hourlyLimit: z.number().int().positive().optional()
});

export const scheduleEmails = async (request: any, response: any, next: any) => {
  try {
    const input = scheduleSchema.parse(request.body);
    if (input.startTime.getTime() <= Date.now()) {
      return response.status(400).json({ error: 'startTime must be in the future' });
    }
    const user = await getRequestUser(request.header('x-user-email'));
    const senders = await prisma.sender.findMany({ where: { userId: user.id, active: true }, orderBy: { createdAt: 'asc' } });
    if (senders.length === 0) {
      return response.status(400).json({ error: 'No active SMTP senders configured' });
    }
    const jobs = await prisma.$transaction(input.recipients.map((recipient, index) => prisma.emailJob.create({
      data: {
        userId: user.id,
        senderId: senders[index % senders.length].id,
        recipient,
        subject: input.subject,
        body: input.body,
        scheduledAt: new Date(input.startTime.getTime() + index * input.delayBetweenEmails),
        delayBetweenEmails: input.delayBetweenEmails,
        hourlyLimit: input.hourlyLimit
      }
    })));
    await Promise.all(jobs.map((job) => emailQueue.add('send-email', { emailId: job.id }, {
      jobId: job.id,
      delay: Math.max(0, job.scheduledAt.getTime() - Date.now()),
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 1000,
      removeOnFail: 5000
    })));
    return response.status(201).json({ count: jobs.length, jobs });
  } catch (error) {
    return next(error);
  }
};

export const listScheduledEmails = async (request: any, response: any, next: any) => {
  try {
    const user = await getRequestUser(request.header('x-user-email'));
    const jobs = await prisma.emailJob.findMany({ where: { userId: user.id, status: 'scheduled' }, orderBy: { scheduledAt: 'asc' } });
    return response.json(jobs);
  } catch (error) {
    return next(error);
  }
};

export const listSentEmails = async (request: any, response: any, next: any) => {
  try {
    const user = await getRequestUser(request.header('x-user-email'));
    const jobs = await prisma.emailJob.findMany({ where: { userId: user.id, status: { in: ['sent', 'failed'] } }, orderBy: { processedAt: 'desc' } });
    return response.json(jobs);
  } catch (error) {
    return next(error);
  }
};
