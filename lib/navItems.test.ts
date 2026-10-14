import { describe, expect, it } from "vitest";
import sitemap from "../app/sitemap";
import { absoluteUrl } from "./site";
import { NAV_ITEMS } from "./navItems";

describe("nav items", () => {
  it("each points at a page in the sitemap", () => {
    const urls = sitemap().map((e) => e.url);
    for (const i of NAV_ITEMS) expect(urls).toContain(absoluteUrl(i.href));
  });
});
