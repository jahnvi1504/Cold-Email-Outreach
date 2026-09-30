import { createApp } from './app.js';
import { env } from './config/env.js';
import './workers/emailWorker.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`API listening on ${env.APP_URL}`);
});
