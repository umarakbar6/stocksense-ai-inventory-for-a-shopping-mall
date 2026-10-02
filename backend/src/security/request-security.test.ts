import { describe, expect, it } from "vitest";
import { isTrustedBrowserRequest, rateLimit } from "./request-security.js";

describe("state-changing request origin policy", () => {
  it("allows safe methods and trusted development origins", () => {
    expect(isTrustedBrowserRequest("GET", "https://evil.example", "cross-site")).toBe(true);
    expect(isTrustedBrowserRequest("POST", "http://127.0.0.1:5173", "same-site")).toBe(true);
    expect(isTrustedBrowserRequest("POST", "http://localhost:5173", "same-site")).toBe(true);
  });

  it("blocks cross-site writes even when the attacker omits or spoofs Origin", () => {
    expect(isTrustedBrowserRequest("POST", "https://evil.example", "cross-site")).toBe(false);
    expect(isTrustedBrowserRequest("PATCH", undefined, "cross-site")).toBe(false);
  });

  it("allows non-browser service calls without browser origin metadata", () => {
    expect(isTrustedBrowserRequest("POST")).toBe(true);
  });
});

describe("abuse throttling", () => {
  it("returns a stable rate-limit error after the configured allowance", () => {
    const middleware = rateLimit({ windowMs: 60_000, max: 2, scope: "test" });
    const headers = new Map<string, unknown>();
    const request = { ip: "127.0.0.9", socket: {}, method: "POST" } as never;
    const response = { setHeader: (name: string, value: unknown) => headers.set(name, value) } as never;
    const seen: unknown[] = [];
    middleware(request, response, (error?: unknown) => { seen.push(error); });
    middleware(request, response, (error?: unknown) => { seen.push(error); });
    middleware(request, response, (error?: unknown) => { seen.push(error); });
    expect(seen.slice(0, 2)).toEqual([undefined, undefined]);
    expect(seen[2]).toMatchObject({ status: 429, code: "RATE_LIMITED" });
    expect(headers.get("Retry-After")).toBeTypeOf("number");
  });
});
