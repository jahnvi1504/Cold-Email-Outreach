import { prisma } from '../db/client.js';

export const notifyRateLimit = async (userId: string, senderEmail: string, retryAt: number) => {
  const connection = await prisma.slackConnection.findUnique({ where: { userId } });
  if (!connection?.incomingHook) return;
  try {
    await fetch(connection.incomingHook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: `Email sender ${senderEmail} reached its hourly limit. Delivery will resume at ${new Date(retryAt).toISOString()}.` }) });
  } catch (error) {
    console.error('Slack rate-limit notification failed', error);
  }
};
