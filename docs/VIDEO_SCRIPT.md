# ReachInbox Demo Script (under 5 minutes)

| Time | On screen | Script |
| --- | --- | --- |
| 0:00-0:25 | Dashboard login | “This is ReachInbox, a durable email job scheduler. It turns a lead list into controlled, observable delivery jobs instead of relying on a browser tab staying open.” |
| 0:25-1:15 | Google login, compose modal, CSV upload | “I’ll sign in with Google. In Compose, I enter a subject and message, upload a CSV, and the parser reports the unique recipient count. I choose a future start time, a one-second delay, and an hourly limit, then schedule.” |
| 1:15-1:45 | Scheduled and Sent tabs | “The Scheduled tab is backed by Postgres rows and shows each recipient independently. The Sent tab later shows successful and permanently failed deliveries. Empty, loading, and error states are built into both views.” |
| 1:45-2:10 | `/admin/queues`, Elasticsearch search request | “Bull Board exposes the live BullMQ queue. Search goes to Elasticsearch, which indexes jobs when created and after status changes.” |
| 2:10-2:55 | Terminal stopping and restarting backend | “Here is the restart scenario. I stop the API while future jobs exist, then start it again. On boot, recovery scans scheduled Postgres rows and re-adds only missing deterministic job IDs. The worker claims rows atomically, so the same email is never sent twice.” |
| 2:55-3:35 | Load seed, queue, Slack channel | “For load, the seed creates 1,000 jobs. Redis enforces the one-second minimum and the sender hourly counter across workers. When a window fills, jobs move to the next hour rather than failing or disappearing. This Slack message is the live rate-limit notification.” |
| 3:35-4:35 | Architecture diagram or code | “The API validates with Zod and persists with Prisma. BullMQ provides durable delayed timers, Redis provides distributed coordination, Nodemailer sends through Ethereal, and Elasticsearch handles search. Google creates the session, while Slack OAuth stores the user webhook. Retries use exponential backoff; only exhausted transient failures become failed.” |
| 4:35-4:55 | README and deployment files | “The deployment baseline includes Dockerfiles, Render configuration, and Vercel configuration. Managed Postgres, Redis, and Elasticsearch URLs replace the local services in production.” |
