import { describe, expect, it } from "vitest";
import { isSource } from "../src/sources";

describe("isSource", () => {
	it.each(["stripe", "github", "demo"])("accepts %s", (value) => {
		expect(isSource(value)).toBe(true);
	});

	it.each(["", "Stripe", "slack", "../etc"])("rejects %j", (value) => {
		expect(isSource(value)).toBe(false);
	});
});
