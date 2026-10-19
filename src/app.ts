import { Hono } from "hono";
import { type RequestIdVariables, requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { problem } from "./problem";
import { isSource, SOURCES } from "./sources";

export interface Bindings {
	APP_NAME: string;
	GIT_SHA: string;
	MAX_BODY_BYTES: string;
}

export type AppEnv = { Bindings: Bindings; Variables: RequestIdVariables };

export function createApp() {
	const app = new Hono<AppEnv>();

	app.use("*", requestId());
	app.use("*", secureHeaders());

	app.get("/", (c) =>
		c.json({
			name: c.env.APP_NAME,
			description: "Reliable webhook ingestion and delivery gateway",
			endpoints: {
				health: "GET /health",
				ingest: `POST /in/{source} (source: ${SOURCES.join(" | ")})`,
			},
			docs: "https://github.com/amaury-molina/hookrelay",
		}),
	);

	app.get("/health", (c) =>
		c.json({
			status: "ok",
			service: c.env.APP_NAME,
			version: c.env.GIT_SHA,
			time: new Date().toISOString(),
		}),
	);

	app.post("/in/:source", async (c) => {
		const source = c.req.param("source");
		if (!isSource(source)) {
			return problem(c, 404, "Unknown source", `Supported sources: ${SOURCES.join(", ")}`);
		}

		const maxBytes = Number(c.env.MAX_BODY_BYTES);
		const declared = Number(c.req.header("content-length") ?? "0");
		if (declared > maxBytes) {
			return problem(c, 413, "Payload too large", `Limit is ${maxBytes} bytes`);
		}

		// Signature verification needs the exact bytes the provider signed,
		// so the body is read raw and never re-serialized.
		const raw = await c.req.arrayBuffer();
		if (raw.byteLength > maxBytes) {
			return problem(c, 413, "Payload too large", `Limit is ${maxBytes} bytes`);
		}
		if (raw.byteLength === 0) {
			return problem(c, 400, "Empty body", "A webhook payload is required");
		}

		// Phase 0: acknowledge only. Phase 1 verifies the signature, persists
		// the event in D1 and enqueues it before acknowledging.
		return c.json(
			{
				status: "accepted",
				source,
				bytes: raw.byteLength,
				requestId: c.get("requestId"),
				receivedAt: new Date().toISOString(),
			},
			202,
		);
	});

	app.notFound((c) => problem(c, 404, "Not found"));

	app.onError((err, c) => {
		console.error(
			JSON.stringify({
				level: "error",
				msg: "unhandled_error",
				requestId: c.get("requestId"),
				error: err.message,
			}),
		);
		return problem(c, 500, "Internal error");
	});

	return app;
}
