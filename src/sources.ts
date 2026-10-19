/**
 * Webhook providers HookRelay accepts on `POST /in/:source`.
 *
 * Phase 0 only validates the source name. Phase 1 attaches a signature
 * verifier to each source (Stripe-Signature, X-Hub-Signature-256 and the
 * Standard Webhooks headers).
 */
export const SOURCES = ["stripe", "github", "demo"] as const;

export type Source = (typeof SOURCES)[number];

export function isSource(value: string): value is Source {
	return (SOURCES as readonly string[]).includes(value);
}
