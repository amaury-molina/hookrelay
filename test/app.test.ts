import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const BASE = "https://hookrelay.test";

function call(path: string, init?: RequestInit) {
	return exports.default.fetch(new Request(`${BASE}${path}`, init));
}

describe("GET /health", () => {
	it("reports the service as healthy with its version", async () => {
		const res = await call("/health");
		expect(res.status).toBe(200);
		const body = await res.json<{ status: string; service: string; version: string }>();
		expect(body.status).toBe("ok");
		expect(body.service).toBe("hookrelay");
		expect(body.version).toBeTruthy();
	});

	it("tags every response with a request id", async () => {
		const res = await call("/health");
		expect(res.headers.get("x-request-id")).toMatch(/.+/);
	});
});

describe("POST /in/:source", () => {
	it("accepts a payload from a known source", async () => {
		const res = await call("/in/demo", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ type: "demo.ping" }),
		});
		expect(res.status).toBe(202);
		const body = await res.json<{ status: string; source: string; bytes: number }>();
		expect(body.status).toBe("accepted");
		expect(body.source).toBe("demo");
		expect(body.bytes).toBeGreaterThan(0);
	});

	it("rejects an unknown source with a problem+json 404", async () => {
		const res = await call("/in/unknown", { method: "POST", body: "{}" });
		expect(res.status).toBe(404);
		expect(res.headers.get("content-type")).toContain("application/problem+json");
		const body = await res.json<{ title: string }>();
		expect(body.title).toBe("Unknown source");
	});

	it("rejects an empty body", async () => {
		const res = await call("/in/stripe", { method: "POST" });
		expect(res.status).toBe(400);
	});

	it("rejects payloads above the size limit", async () => {
		const big = "x".repeat(262_145);
		const res = await call("/in/github", { method: "POST", body: big });
		expect(res.status).toBe(413);
	});
});

describe("unknown routes", () => {
	it("return a problem+json 404", async () => {
		const res = await call("/nope");
		expect(res.status).toBe(404);
		expect(res.headers.get("content-type")).toContain("application/problem+json");
	});
});
