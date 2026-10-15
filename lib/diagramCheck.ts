// Diagram SVG is injected with dangerouslySetInnerHTML, so only the drawing elements and attributes the diagrams
// actually use are allowed. Anything else (script, a, image, foreignObject, style, event handlers, hrefs) fails the build.
const ELEMENTS = new Set(["svg", "title", "desc", "defs", "marker", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan"]);
const ATTRIBUTES = new Set([
  "class", "id", "role", "aria-labelledby", "aria-label", "aria-hidden", "viewbox", "xmlns", "preserveaspectratio",
  "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "width", "height", "d", "points", "transform",
  "text-anchor", "dominant-baseline", "font-size", "font-weight", "opacity", "fill", "stroke", "stroke-width", "stroke-dasharray",
  "marker-start", "marker-mid", "marker-end", "refx", "refy", "markerwidth", "markerheight", "orient", "markerunits",
]);
// A well-formed tag: quotes are respected, so a ">" inside an attribute value cannot hide markup.
const TAG = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s=\/>"']+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>/g;
const ATTR = /\s+([^\s=\/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

const nonEmpty = (v: unknown) => typeof v === "string" && v.trim().length > 0;

/** Diagrams are hand-written SVG; enforce the site's design rules and a safe element and attribute allowlist. */
export function checkDiagram(svg: string | undefined): string[] {
  if (!nonEmpty(svg)) return ["is empty"];
  const problems: string[] = [];
  if (!/^<svg[\s>]/.test(svg!.trim())) problems.push("must start with <svg");
  if (!/viewBox=/.test(svg!)) problems.push("needs a viewBox so it scales");
  if (!/<title[^>]*>[^<]+<\/title>/.test(svg!)) problems.push("needs a <title> for screen readers");
  if (/gradient|<filter|drop-shadow/i.test(svg!)) problems.push("uses gradients, filters or shadows");

  for (const [, , name, attrs] of svg!.matchAll(TAG)) {
    if (!ELEMENTS.has(name.toLowerCase())) problems.push(`uses <${name}>, which is not an allowed drawing element`);
    for (const [, attr, ...value] of attrs.matchAll(ATTR)) {
      if (!ATTRIBUTES.has(attr.toLowerCase())) problems.push(`uses the attribute ${attr}, which is not allowed`);
      if (/javascript:|url\(\s*["']?\s*(?!#)/i.test(value.join(""))) problems.push(`has an unsafe value in ${attr}`);
    }
  }
  // Whatever is left after the well-formed tags are removed must be plain text: a stray "<" is a comment, CDATA or broken markup.
  if (svg!.replace(TAG, "").includes("<")) problems.push("contains markup that is not a plain allowed tag (comment, CDATA or broken tag)");
  return [...new Set(problems)];
}
