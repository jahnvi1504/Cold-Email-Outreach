import type { Sender } from '@prisma/client';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { env } from '../config/env.js';
import { prisma } from '../db/client.js';

const senderConfigSchema = z.object({
  email: z.string().email(),
  displayName: z.string().optional(),
  host: z.string(),
  port: z.number().int().positive(),
  username: z.string(),
  password: z.string(),
  secure: z.boolean().default(false)
});

export type SenderConfig = z.infer<typeof senderConfigSchema>;

const configuredSenders = (): SenderConfig[] => {
  const raw: unknown = JSON.parse(env.SMTP_SENDERS_JSON);
  return z.array(senderConfigSchema).parse(raw);
};

export const ensureSenders = async (userId: string) => {
  const configs = configuredSenders();
  for (const config of configs) {
    await prisma.sender.upsert({
      where: { userId_email: { userId, email: config.email } },
      update: config,
      create: { ...config, userId }
    });
  }
  return prisma.sender.findMany({ where: { userId, active: true }, orderBy: { createdAt: 'asc' } });
};

export const createTransport = (sender: Sender) => nodemailer.createTransport({
  host: sender.host,
  port: sender.port,
  secure: sender.secure,
  auth: { user: sender.username, pass: sender.password }
});

export const sendEmail = async (sender: Sender, recipient: string, subject: string, body: string) => {
  await createTransport(sender).sendMail({
    from: sender.displayName ? `"${sender.displayName}" <${sender.email}>` : sender.email,
    to: recipient,
    subject,
    text: body,
    html: body.replaceAll('\n', '<br />')
  });
};
