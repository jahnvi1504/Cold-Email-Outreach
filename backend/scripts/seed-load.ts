import { prisma } from '../src/db/client.js';
import { emailQueue } from '../src/queue/emailQueue.js';

const user = await prisma.user.upsert({ where: { email: 'load-test@example.com' }, update: {}, create: { email: 'load-test@example.com', name: 'Load Test' } });
const sender = await prisma.sender.findFirst({ where: { userId: user.id, active: true } });
if (!sender) throw new Error('Configure at least one sender before running the load seed');
const start = new Date(Date.now() + 60_000);
const records = await prisma.$transaction(Array.from({ length: 1000 }, (_, index) => prisma.emailJob.create({ data: { userId: user.id, senderId: sender.id, recipient: `load-${index}@example.com`, subject: 'ReachInbox load test', body: 'Load test message', scheduledAt: new Date(start.getTime() + index * 1000), delayBetweenEmails: 1000 } })));
await Promise.all(records.map((record) => emailQueue.add('send-email', { emailId: record.id }, { jobId: record.id, delay: Math.max(0, record.scheduledAt.getTime() - Date.now()), attempts: 5, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 1000, removeOnFail: 5000 })));
console.log(`Queued ${records.length} jobs starting at ${start.toISOString()}`);
await prisma.$disconnect();
