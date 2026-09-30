export type User = { id: string; name: string; email: string; avatarUrl?: string | null };
export type EmailJob = { id: string; recipient: string; subject: string; scheduledAt: string; processedAt?: string | null; status: 'scheduled' | 'processing' | 'sent' | 'failed'; lastError?: string | null };
export type ScheduleInput = { subject: string; body: string; recipients: string[]; startTime: string; delayBetweenEmails: number; hourlyLimit?: number };
