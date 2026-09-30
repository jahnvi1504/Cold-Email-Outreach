import { Queue } from 'bullmq';
import { redis } from './connection.js';

export const EMAIL_QUEUE_NAME = 'email-delivery';
export const emailQueue = new Queue(EMAIL_QUEUE_NAME, { connection: redis });
