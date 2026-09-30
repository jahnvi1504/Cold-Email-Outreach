import { Client } from '@elastic/elasticsearch';
import type { EmailJob } from '@prisma/client';
import { env } from '../config/env.js';

export const emailSearch = new Client({ node: env.ELASTICSEARCH_URL });
const index = 'email-jobs';

export const indexEmail = async (email: EmailJob) => {
  try {
    await emailSearch.index({ index, id: email.id, document: {
      userId: email.userId,
      recipient: email.recipient,
      subject: email.subject,
      body: email.body,
      scheduledAt: email.scheduledAt,
      processedAt: email.processedAt,
      status: email.status,
      updatedAt: email.updatedAt
    }, refresh: 'wait_for' });
  } catch (error) {
    console.error('Elasticsearch indexing failed', error);
  }
};

export const searchEmails = async (userId: string, query: string) => {
  try {
    const result = await emailSearch.search({ index, query: {
      bool: { must: [{ multi_match: { query, fields: ['recipient', 'subject', 'body'] } }], filter: [{ term: { userId } }] }
    } });
    return result.hits.hits.map((hit) => hit._source);
  } catch (error) {
    console.error('Elasticsearch search failed', error);
    return [];
  }
};
