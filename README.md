# ReachInbox Email Job Scheduler

Production-oriented email scheduling monorepo built with TypeScript, Express, BullMQ, Redis, PostgreSQL, Elasticsearch, React, and Vite.

## Repository layout

- `backend/` API, persistence, queue, workers, authentication, and integrations
- `frontend/` React dashboard
- `docker-compose.yml` local Redis, PostgreSQL, and Elasticsearch
- `docs/` implementation and recording documentation

## Quick start

1. Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`.
2. Start local infrastructure with `npm run infra:up`.
3. Install workspace dependencies with `npm install`.
4. Run the backend and frontend with `npm run dev:backend` and `npm run dev:frontend`.

The detailed setup, OAuth configuration, Ethereal sender setup, architecture, restart guarantees, rate limiting, deployment, and demo flow will be documented as the service is implemented.

## External setup still required

Google OAuth credentials, a Slack OAuth app, Ethereal SMTP sender accounts, and production managed service credentials cannot be safely created in this repository. The final handoff will include a checklist for those user-owned steps.
