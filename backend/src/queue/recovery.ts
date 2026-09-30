import { prisma } from '../db/client.js';
import { emailQueue } from './emailQueue.js';

export const recoverScheduledJobs = async () => {
  const scheduled = await prisma.emailJob.findMany({ where: { status: 'scheduled' }, select: { id: true, scheduledAt: true } });
  for (const email of scheduled) {
    const existing = await emailQueue.getJob(email.id);
    if (existing) continue;
    await emailQueue.add('send-email', { emailId: email.id }, {
      jobId: email.id,
      delay: Math.max(0, email.scheduledAt.getTime() - Date.now()),
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 1000,
      removeOnFail: 5000
    });
  }
  console.log(`Recovered ${scheduled.length} scheduled email records`);
};
