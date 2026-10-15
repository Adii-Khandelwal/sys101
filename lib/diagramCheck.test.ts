import { describe, expect, it } from "vitest";
import { checkDiagram } from "./diagramCheck";

const wrap = (inner: string) => `<svg viewBox="0 0 10 10" role="img" aria-labelledby="t"><title id="t">A diagram</title>${inner}</svg>`;

describe("checkDiagram", () => {
  it("accepts the drawing elements the diagrams use", () => {
    const ok = wrap(`<defs><marker id="a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6z"/></marker></defs><rect class="box" x="1" y="1" width="4" height="4"/><circle cx="2" cy="2" r="1"/><line x1="0" y1="0" x2="5" y2="5" marker-end="url(#a)"/><text x="1" y="2" text-anchor="middle" font-size="12">a &amp; b</text>`);
    expect(checkDiagram(ok)).toEqual([]);
  });

  it.each([
    ["an event handler without a space before it", wrap(`<image/onerror="x"/>`)],
    ["a script element", wrap(`<script>alert(1)</script>`)],
    ["a link with a javascript: address", wrap(`<a href="javascript:alert(1)"><text x="1" y="1">x</text></a>`)],
    ["foreignObject", wrap(`<foreignObject><p>hi</p></foreignObject>`)],
    ["an iframe", wrap(`<iframe src="https://example.com"></iframe>`)],
    ["a hidden handler after a quoted >", wrap(`<rect width="1" height="1" class="a>b" onclick="x"/>`)],
    ["a comment", wrap(`<!-- <script> -->`)],
    ["CDATA", wrap(`<![CDATA[<script>]]>`)],
    ["an external url() fill", wrap(`<rect width="1" height="1" fill="url(https://example.com/x)"/>`)],
    ["a style element", wrap(`<style>rect{fill:red}</style>`)],
  ])("rejects %s", (_name, svg) => {
    expect(checkDiagram(svg).length).toBeGreaterThan(0);
  });

  it("keeps the older rules: starts with svg, has a viewBox and a title, no gradients", () => {
    expect(checkDiagram("<div></div>").join()).toMatch(/must start with <svg/);
    expect(checkDiagram(`<svg><title>t</title></svg>`).join()).toMatch(/viewBox/);
    expect(checkDiagram(wrap(`<defs><linearGradient/></defs>`)).join()).toMatch(/gradients/);
    expect(checkDiagram(undefined)).toEqual(["is empty"]);
  });
});
