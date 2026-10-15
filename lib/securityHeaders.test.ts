import { describe, expect, it } from "vitest";
import { CSP, SECURITY_HEADERS } from "./securityHeaders";

const directive = (name: string) =>
  CSP.split(";")
    .map((d) => d.trim())
    .find((d) => d.startsWith(name + " "));

describe("security headers", () => {
  it("lets nothing run from or be fetched from another origin, except the YouTube facade's frame", () => {
    for (const d of ["default-src", "script-src", "style-src", "img-src", "font-src", "connect-src", "worker-src"]) {
      expect(directive(d), d).toBeDefined();
      expect(directive(d), d).not.toMatch(/https?:|\*/);
    }
    expect(directive("frame-src")).toBe("frame-src https://www.youtube-nocookie.com");
  });

  it("forbids eval, plugins, framing, a changed base and form posts elsewhere", () => {
    expect(CSP).not.toContain("'unsafe-eval'");
    expect(directive("object-src")).toBe("object-src 'none'");
    expect(directive("frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive("base-uri")).toBe("base-uri 'self'");
    expect(directive("form-action")).toBe("form-action 'self'");
  });

  it("sends the policy and the plain hardening headers", () => {
    const keys = SECURITY_HEADERS.map((h) => h.key);
    expect(keys).toEqual(
      expect.arrayContaining(["Content-Security-Policy", "X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"]),
    );
  });
});
