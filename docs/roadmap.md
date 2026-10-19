# Roadmap

Each phase ends deployed to production and demonstrable at the public URL.

| Phase | Scope | Done when |
| --- | --- | --- |
| **0. Walking skeleton** | Worker, `/health`, `/in/{source}` (202), CI/CD with smoke test, devcontainer | Merge to `main` deploys and `/health` reports the commit SHA |
| **1. Reliable ingest** | Signature verification (Stripe, GitHub, Standard Webhooks), D1 persistence, idempotency on `(source, external_id)`, enqueue | Same event sent twice stores one row; an invalid signature returns 401 |
| **2. Delivery** | Destinations, routing rules, queue consumer, signed outbound delivery, exponential backoff with jitter, DLQ, replay API | A destination that fails 3 times then recovers receives the event; exhausted events land in the DLQ and replay works |
| **3. Operations** | Dashboard, chaos mode on the demo sink, per-IP demo limits, cron cleanup, SSRF guard, secret rotation | A recruiter can trigger, break and replay deliveries from the browser |
| **4. Proof** | Chaos test, load test, contract tests with recorded payloads, ADRs, v1.0.0 release | Published results show zero lost events when a consumer is killed mid-delivery |
