# ReachInbox Full-stack Email Job Scheduler

ReachInbox is a durable email scheduler with a React dashboard, Express API, PostgreSQL persistence, BullMQ/Redis delivery, Elasticsearch search, Bull Board, Ethereal SMTP support, Google OAuth, and Slack rate-limit notifications.

## Run locally

Prerequisites: Node 20.19+ (Node 22.12+ for the latest Vite), Docker Desktop, and npm.

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
npm install
npm run infra:up
npm run db:deploy --workspace backend
npm run dev:backend
# In another terminal:
npm run dev:frontend
```

The API is at `http://localhost:4000`, the dashboard at `http://localhost:5173`, and Bull Board at `http://localhost:4000/admin/queues`. The local stack uses Redis `6379`, Postgres `5432`, and Elasticsearch `9200`. Docker volumes preserve data across container restarts.

## Environment variables

Backend variables live in `backend/.env`: `NODE_ENV`, `PORT`, `APP_URL`, `FRONTEND_URL`, `DATABASE_URL`, `REDIS_URL`, `ELASTICSEARCH_URL`, `SESSION_SECRET`, `JWT_SECRET`, `WORKER_CONCURRENCY`, `MIN_DELAY_BETWEEN_EMAILS_MS`, `MAX_EMAILS_PER_HOUR_PER_SENDER`, Google `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, Slack `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_REDIRECT_URI`, and `SMTP_SENDERS_JSON`.

`SMTP_SENDERS_JSON` is a JSON array such as:

```json
[{"email":"sender@example.com","displayName":"ReachInbox","host":"smtp.ethereal.email","port":587,"username":"...","password":"...","secure":false}]
```

Create Ethereal accounts at `https://ethereal.email/create`, copy each SMTP credential into this array, and restart the backend. Multiple objects are rotated round-robin per scheduled recipient.

## Architecture and guarantees

The schedule endpoint validates input with Zod, creates one `EmailJob` row per recipient, and adds one BullMQ delayed job whose deterministic `jobId` is the database email ID. PostgreSQL is the source of truth; Redis/BullMQ is the delivery timer. On startup, the recovery pass scans scheduled rows and re-adds only jobs missing from the queue, which handles restarts and a crash between database commit and enqueue.

Workers atomically claim `scheduled` rows with `updateMany`, so parallel workers cannot send the same row twice. SMTP failures return the row to `scheduled` for BullMQ exponential retries; the final failed event marks it `failed`. Successful sends become `sent` and are indexed in Elasticsearch.

The chosen default minimum delay is **1,000 ms** (`MIN_DELAY_BETWEEN_EMAILS_MS`). A Redis sender lock enforces it across workers and instances. Hourly quotas use Redis `INCR` plus `EXPIRE` keys in the form `email-rate:{senderId}:{hourWindow}`. A request-level `hourlyLimit` overrides the global default. A full window never drops a job: the worker moves it to the next UTC hour, and posts a live Slack message through the connected incoming webhook. Missing Slack configuration is intentionally a no-op.

BullMQ delayed jobs and Redis persistence spread a 1,000+ recipient batch over the configured delay and hourly windows. The trade-off is that strict global ordering is relaxed when multiple senders/workers are active; delivery safety and throughput take priority.

## Features mapped to requirements

- Backend: TypeScript Express API, Prisma schema/migration, Zod validation, Ethereal SMTP sender rotation, durable BullMQ delayed jobs, concurrency, retry/backoff, Redis limits, Bull Board, Elasticsearch, Google OAuth, Slack OAuth, and centralized error handling.
- Frontend: React/Vite/TypeScript dashboard with responsive layout, OAuth login, profile/logout, scheduled/sent tabs, CSV/text parsing with unique email count, compose controls, loading/empty/error states, and Slack connect.
- Search: `GET /api/search?q=...` searches recipient, subject, and body in Elasticsearch for the authenticated user.

## Useful commands

```powershell
npm run typecheck
npm run build
npm run seed:load --workspace backend
npm run infra:logs
npm run infra:down
```

The load seed creates and queues 1,000 records one second apart. It requires a configured sender and is intended for a local rate-limit/restart demonstration.

## OAuth setup

In Google Cloud Console, create a Web OAuth client, add `http://localhost:4000/api/auth/google/callback` as an authorized redirect URI, and copy the client ID/secret to the backend env. In Slack API, create an app, enable OAuth, add `http://localhost:4000/api/slack/callback`, add the `incoming-webhook` scope, and copy the client ID/secret. Set production redirect URLs when deploying.

## Deployment

`render.yaml` and the two Dockerfiles provide a Render-compatible backend/frontend baseline. For production use managed Postgres (Neon or Supabase), Redis (Upstash or Redis Cloud), and Elasticsearch (Elastic Cloud or Bonsai). Vercel can deploy the frontend using `vercel.json`. Set every backend variable in the platform secret manager, including managed service URLs and OAuth callback URLs.

## Assumptions and trade-offs

The dashboard intentionally has no Figma source because no link/export was supplied; it uses the requested layout with a restrained operations-focused visual system. Slack OAuth requests the incoming webhook scope and stores the webhook URL encrypted only by the platform's database-at-rest controls; add application-level secret encryption before handling high-sensitivity production tenants. The local fallback user exists only for internal controller compatibility and all dashboard routes require a real session cookie.

Live link: `[add after deployment]`

Demo video: `[add after recording]`
