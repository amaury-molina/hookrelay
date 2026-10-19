import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Error responses follow RFC 9457 (Problem Details for HTTP APIs), so every
 * client gets the same machine-readable shape regardless of the failure.
 */
export interface Problem {
	type: string;
	title: string;
	status: number;
	detail?: string;
	instance?: string;
	requestId?: string;
}

export function problem(
	c: Context,
	status: ContentfulStatusCode,
	title: string,
	detail?: string,
): Response {
	const body: Problem = {
		type: "about:blank",
		title,
		status,
		detail,
		instance: new URL(c.req.url).pathname,
		requestId: c.get("requestId"),
	};
	return c.json(body, status, { "Content-Type": "application/problem+json" });
}
