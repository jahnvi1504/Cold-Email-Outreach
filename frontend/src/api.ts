import type { EmailJob, ScheduleInput, User } from './types';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${apiUrl}${path}`, { ...options, credentials: 'include', headers: { 'content-type': 'application/json', ...options?.headers } });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? 'Request failed');
  return response.status === 204 ? (undefined as T) : response.json();
};

export const api = {
  me: () => request<User>('/auth/me'),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  scheduled: () => request<EmailJob[]>('/schedule/scheduled'),
  sent: () => request<EmailJob[]>('/schedule/sent'),
  schedule: (input: ScheduleInput) => request<{ count: number }>('/schedule', { method: 'POST', body: JSON.stringify(input) }),
  disconnectSlack: () => request<void>('/slack', { method: 'DELETE' })
};

export const googleLoginUrl = `${apiUrl}/auth/google`;
export const slackConnectUrl = `${apiUrl}/slack/connect`;
