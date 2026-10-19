# ADR 0001: Cloudflare Workers as the runtime

- **Status:** Accepted
- **Date:** 2026-10-18

## Context

HookRelay receives webhooks from third-party providers, must acknowledge them
within a few hundred milliseconds, and must deliver them to internal
destinations with retries and a dead-letter queue. The project has three
constraints beyond the technical ones:

1. Everything runs in the cloud: development in GitHub Codespaces, CI in
   GitHub Actions, no local installs.
2. A public demo URL must stay available at near-zero cost.
3. The design must still look like production: real queues, real retries,
   real persistence.

The first design used Fastify, PostgreSQL, Redis and BullMQ. A BullMQ worker is
an always-on process, which no free hosting tier keeps running.

## Decision

Run HookRelay on Cloudflare Workers, using platform primitives instead of
self-managed infrastructure:

| Concern | Primitive |
| --- | --- |
| HTTP ingest and admin API | Workers (TypeScript, Hono) |
| Delivery pipeline, retries, DLQ | Cloudflare Queues (phase 1) |
| Events, deliveries, attempts | D1 / SQLite (phase 1) |
| Scheduled cleanup | Cron Triggers (phase 3) |
| Logs | Workers Logs |

## Consequences

**Positive**

- No servers to operate; deploys are atomic and global.
- The free plan covers the demo: 100,000 requests/day, Queues with 10,000
  operations/day, D1 with 5M row reads and 100k row writes/day.
- Tests run inside `workerd`, the production runtime, via the Workers Vitest
  integration.

**Negative / risks**

- 10 ms of CPU per invocation on the free plan: handlers stay lean and
  signature verification uses WebCrypto.
- Vendor coupling: queue and storage access go through small interfaces so the
  delivery engine can be ported to AWS SQS + DynamoDB. This is documented, not
  implemented.
- Queue retention on the free plan is 24 hours; events are also persisted in
  D1, which is the source of truth for replay.
