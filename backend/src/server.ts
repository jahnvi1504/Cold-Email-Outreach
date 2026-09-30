import { createApp } from './app.js';
import { env } from './config/env.js';
import './workers/emailWorker.js';
import { recoverScheduledJobs } from './queue/recovery.js';

const app = createApp();

recoverScheduledJobs().then(() => {
  app.listen(env.PORT, () => console.log(`API listening on ${env.APP_URL}`));
}).catch((error) => {
  console.error('Failed to recover scheduled jobs', error);
  process.exitCode = 1;
});
