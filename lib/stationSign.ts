// What the station sign under the map shows. Pure, so the selection rule is easy to test.
import type { HomeAction } from "./nextUp";

/** The first sentence of a concept, trimmed, for a one-line description. */
export function firstSentence(text: string) {
  const end = text.search(/\.\s/);
  const s = end === -1 ? text : text.slice(0, end + 1);
  return s.length > 140 ? s.slice(0, 137).trimEnd() + "…" : s;
}

/** The topic the Next up button points at, or null when it points at none (all read). */
export function nextUpSlug(action: HomeAction, first: string): string | null {
  if (action.kind === "start") return first;
  if (action.kind === "continue") return action.topic.slug;
  if (action.kind === "next") return action.next.slug;
  return null;
}

/** Hover or focus wins; otherwise the Next up topic; otherwise the first topic. */
export function signSlug(active: string | null, nextUp: string | null, first: string): string {
  return active ?? nextUp ?? first;
}

/** Topics to read first and topics this one makes possible, in the order given by `order` (course order). */
export function neighbours(slug: string, edges: { from: string; to: string }[], order: string[]) {
  const rank = (s: string) => order.indexOf(s);
  const sorted = (xs: string[]) => [...new Set(xs)].sort((a, b) => rank(a) - rank(b));
  return {
    before: sorted(edges.filter((e) => e.to === slug).map((e) => e.from)),
    after: sorted(edges.filter((e) => e.from === slug).map((e) => e.to)),
  };
}
