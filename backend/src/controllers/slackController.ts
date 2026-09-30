import { env } from '../config/env.js';
import { createSessionToken, sessionCookie, verifySessionToken } from '../services/authService.js';
import { prisma } from '../db/client.js';

export const slackConnect = (request: any, response: any) => {
  if (!env.SLACK_CLIENT_ID) return response.status(503).json({ error: 'Slack OAuth is not configured' });
  const token = request.headers.cookie?.split(';').map((part: string) => part.trim()).find((part: string) => part.startsWith('reachinbox_session='))?.split('=')[1];
  if (!token) return response.status(401).json({ error: 'Authentication required' });
  const state = createSessionToken(verifySessionToken(token).userId);
  const url = `https://slack.com/oauth/v2/authorize?client_id=${encodeURIComponent(env.SLACK_CLIENT_ID)}&redirect_uri=${encodeURIComponent(env.SLACK_REDIRECT_URI)}&scope=incoming-webhook&state=${encodeURIComponent(state)}`;
  return response.redirect(url);
};

export const slackCallback = async (request: any, response: any, next: any) => {
  try {
    const userId = verifySessionToken(String(request.query.state)).userId;
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code: String(request.query.code), client_id: env.SLACK_CLIENT_ID, client_secret: env.SLACK_CLIENT_SECRET, redirect_uri: env.SLACK_REDIRECT_URI }) });
    const result = await tokenResponse.json() as { ok: boolean; access_token?: string; team?: { id: string; name: string }; incoming_webhook?: { url: string } };
    if (!result.ok || !result.access_token) throw new Error('Slack OAuth exchange failed');
    await prisma.slackConnection.upsert({ where: { userId }, update: { accessToken: result.access_token, teamId: result.team?.id, teamName: result.team?.name, incomingHook: result.incoming_webhook?.url }, create: { userId, accessToken: result.access_token, teamId: result.team?.id, teamName: result.team?.name, incomingHook: result.incoming_webhook?.url } });
    return response.redirect(`${env.FRONTEND_URL}?slack=connected`);
  } catch (error) {
    return next(error);
  }
};

export const slackDisconnect = async (request: any, response: any) => {
  await prisma.slackConnection.deleteMany({ where: { userId: request.userId } });
  return response.status(204).send();
};
