// The rules for content/news/<slug>.json, in one place. Imported by scripts/check-news.mjs (run in the
// build), scripts/verify-news.mjs (needs the network) and the tests.

export const KINDS = ["release", "engineering-post", "standard", "docs"];
export const MAX_ITEMS = 3;
export const NO_DATE = "no date shown";
const ITEM_KEYS = ["id", "kind", "title", "publisher", "url", "dateShown", "summary", "evidence", "addedOn", "verifiedOn"];

const words = (t) => t.trim().split(/\s+/).filter(Boolean).length;
const nonEmpty = (v) => typeof v === "string" && v.trim().length > 0;

/** A real calendar date, YYYY-MM-DD. */
export function isDate(v) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v);
}

/** YYYY-MM-DD, YYYY-MM, YYYY or "no date shown". */
export function isDateShown(v) {
  if (v === NO_DATE) return true;
  if (typeof v !== "string") return false;
  if (/^\d{4}$/.test(v)) return true;
  if (/^\d{4}-\d{2}$/.test(v)) return +v.slice(5) >= 1 && +v.slice(5) <= 12;
  return isDate(v);
}

/** The latest day a dateShown can mean: the day itself, the end of the month, or the end of the year. null when undated. */
export function latestDay(dateShown) {
  if (!isDateShown(dateShown) || dateShown === NO_DATE) return null;
  if (dateShown.length === 10) return dateShown;
  if (dateShown.length === 7) {
    const [y, m] = dateShown.split("-").map(Number);
    return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  }
  return `${dateShown}-12-31`;
}

/** True when the whole dateShown is more than 12 months before `today` (YYYY-MM-DD). */
export function olderThan12Months(dateShown, today) {
  const last = latestDay(dateShown);
  if (!last) return false;
  const cutoff = new Date(`${today}T00:00:00Z`);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
  return new Date(`${last}T00:00:00Z`) < cutoff;
}

/** Same page, ignoring the fragment, query, a trailing slash and a leading www. */
export function normalizeUrl(u) {
  try {
    const x = new URL(u);
    return `${x.hostname.replace(/^www\./, "")}${x.pathname.replace(/\/+$/, "")}`.toLowerCase();
  } catch {
    return String(u).toLowerCase();
  }
}

const ENTRY_KEYS = ["host", "pathPrefix", "pathPattern", "publisher", "kinds"];
const MAX_PATTERN = 200;

/**
 * A pathPattern is an anchored regular expression for the URL path, for sites whose paths vary by locale. Only entries in
 * docs/news-state.json carry one, and only a person edits that. It is kept to a shape that cannot backtrack badly:
 * anchored with ^, short, no lookarounds, named groups or backreferences, no quantifier on a group, at most one unbounded
 * quantifier. Returns a list of problems.
 */
export function patternProblems(p) {
  if (typeof p !== "string" || !p) return ["pathPattern must be a non-empty string"];
  const out = [];
  if (!p.startsWith("^")) out.push("pathPattern must be anchored with ^");
  if (p.length > MAX_PATTERN) out.push(`pathPattern is longer than ${MAX_PATTERN} characters`);
  // Strip escaped characters and character classes so the checks below look only at structure.
  const bare = p.replace(/\\./g, "x").replace(/\[(?:[^\]\\]|\\.)*\]/g, "x");
  if (/\\[1-9k]/.test(p)) out.push("pathPattern may not use backreferences");
  if (/\((?!\?:)/.test(bare) && /\(\?/.test(bare)) out.push("pathPattern may use only plain and (?: ) groups, no lookarounds or named groups");
  if (/\)[*+?{]/.test(bare)) out.push("pathPattern may not put a quantifier on a group");
  if ((bare.match(/[*+]|\{\d+,\d*\}/g) ?? []).length > 1) out.push("pathPattern may have at most one unbounded quantifier");
  try {
    new RegExp(p);
  } catch {
    out.push("pathPattern is not a valid regular expression");
  }
  return out;
}

/**
 * An allowlist entry: { host, pathPrefix? or pathPattern?, publisher, kinds? }. `host` is a bare domain (no scheme, no path),
 * `pathPrefix` starts with "/" (or `pathPattern` is an anchored regex, see patternProblems), `publisher` is the exact string an item must use, `kinds` limits the item kinds.
 */
export function isAllowEntry(e) {
  if (!e || typeof e !== "object" || Array.isArray(e)) return false;
  if (Object.keys(e).some((k) => !ENTRY_KEYS.includes(k))) return false;
  if (typeof e.host !== "string" || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(e.host)) return false;
  if (e.pathPrefix !== undefined && e.pathPattern !== undefined) return false;
  if (e.pathPrefix !== undefined && !(typeof e.pathPrefix === "string" && /^\/[A-Za-z0-9._~\/-]*$/.test(e.pathPrefix))) return false;
  if (e.pathPattern !== undefined && patternProblems(e.pathPattern).length) return false;
  if (!nonEmpty(e.publisher)) return false;
  if (e.kinds !== undefined && !(Array.isArray(e.kinds) && e.kinds.length > 0 && e.kinds.every((k) => KINDS.includes(k)))) return false;
  return true;
}

/** Does this entry cover the URL? https only, no credentials, no other port, host equal or a true subdomain, path inside the prefix. */
function entryCovers(u, entry) {
  const host = u.hostname.toLowerCase();
  const domain = entry.host.toLowerCase();
  if (host !== domain && !host.endsWith(`.${domain}`)) return false;
  if (entry.pathPattern) return new RegExp(entry.pathPattern).test(u.pathname);
  if (!entry.pathPrefix) return true;
  const prefix = entry.pathPrefix;
  return u.pathname === prefix || u.pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`);
}

function parseHttps(url) {
  try {
    const u = new URL(url);
    return u.protocol !== "https:" || u.username || u.password || (u.port && u.port !== "443") ? null : u;
  } catch {
    return null;
  }
}

/** Is this URL inside the allowlist (host and path only)? Used for the page itself and every redirect hop. */
export function urlAllowed(url, entries) {
  const u = parseHttps(url);
  return !!u && entries.some((e) => entryCovers(u, e));
}

/** Problems with an item against the allowlist: the URL, then the publisher and kind of the entries that cover it. */
export function itemAllowedProblems(item, entries) {
  const u = parseHttps(item.url);
  const covering = u ? entries.filter((e) => entryCovers(u, e)) : [];
  if (!covering.length) return ["url is not inside allowedDomains for this topic (host and path prefix)"];
  const named = covering.filter((e) => e.publisher === item.publisher);
  if (!named.length) return [`publisher "${item.publisher}" does not match the allowlist entry (${[...new Set(covering.map((e) => `"${e.publisher}"`))].join(", ")})`];
  if (!named.some((e) => !e.kinds || e.kinds.includes(item.kind))) {
    return [`kind "${item.kind}" is not allowed for this source (allowed: ${[...new Set(named.flatMap((e) => e.kinds ?? []))].join(", ")})`];
  }
  return [];
}

const BANNED = /—|\bnot\b[^.]{0,60}\bbut\b|\bit['’]s not\b|\bisn['’]t just\b/i;

const COMPARATIVE = /\b(faster|higher|lower|more|less|better|improves?|improved)\b/i;
const ATTRIBUTION = /\b(says|reports|claims|describes)\b/i;

/** Rules for one item's summary. `publisher` names the source the summary must credit. Returns problems. */
export function checkSummary(summary, evidence, publisher = "") {
  if (!nonEmpty(summary)) return ["summary is empty"];
  const out = [];
  const n = words(summary);
  if (n < 12 || n > 30) out.push(`summary is ${n} words, needs 12 to 30`);
  if (!/[.!?]$/.test(summary.trim()) || /[.!?]\s+\S/.test(summary.trim())) out.push("summary must be one sentence ending with a full stop");
  if (BANNED.test(summary)) out.push('summary has banned phrasing (em dash or "not X but Y")');
  for (const d of summary.match(/\d[\d,.]*\d|\d/g) ?? []) {
    if (!String(evidence ?? "").includes(d)) out.push(`summary figure "${d}" does not appear in the evidence`);
  }
  // A figure or a comparison is the source's claim: the sentence says so and names the source.
  if (/\d/.test(summary) || COMPARATIVE.test(summary)) {
    const name = publisher.trim().split(/\s+/)[0]?.replace(/[^\w]/g, "");
    if (!ATTRIBUTION.test(summary) || (name && !new RegExp(`\\b${name}\\b`, "i").test(summary))) {
      out.push(`summary has a figure or comparison, so it needs an attribution phrase (says, reports, claims, describes) naming "${name}"`);
    }
  }
  return out;
}

/**
 * Validate one content/news/<slug>.json.
 * ctx: { allowedDomains: string[], originalUrls: string[], today: "YYYY-MM-DD" }
 * Returns { errors, warnings }.
 */
export function validateNews(data, ctx) {
  const errors = [];
  const warnings = [];
  if (!data || typeof data !== "object" || Array.isArray(data)) return { errors: ["file must be an object"], warnings };
  for (const k of Object.keys(data)) if (!["asOf", "items"].includes(k)) errors.push(`unknown field "${k}"`);
  if (!isDate(data.asOf)) errors.push("asOf must be a YYYY-MM-DD date");
  else if (data.asOf > ctx.today) errors.push("asOf is in the future");
  if (!Array.isArray(data.items)) return { errors: [...errors, "items must be an array"], warnings };
  if (data.items.length > MAX_ITEMS) errors.push(`${data.items.length} items, at most ${MAX_ITEMS}`);
  if ((data.items.length ?? 0) > 0 && !ctx.allowedDomains?.length) errors.push("this topic has no allowedDomains in docs/news-state.json");
  const originals = new Set(ctx.originalUrls.map(normalizeUrl));
  const ids = new Set();
  data.items.forEach((it, i) => {
    const where = `item ${i + 1}${it?.id ? ` (${it.id})` : ""}`;
    const err = (m) => errors.push(`${where}: ${m}`);
    if (!it || typeof it !== "object") return err("must be an object");
    for (const k of Object.keys(it)) if (!ITEM_KEYS.includes(k)) err(`unknown field "${k}"`);
    for (const k of ["id", "title", "publisher", "url", "summary", "evidence"]) if (!nonEmpty(it[k])) err(`${k} is empty`);
    if (nonEmpty(it.id)) {
      if (!/^[a-z0-9][a-z0-9-]*$/.test(it.id)) err("id must be lowercase letters, digits and hyphens");
      if (ids.has(it.id)) err("duplicate id");
      ids.add(it.id);
    }
    if (!KINDS.includes(it.kind)) err(`kind must be one of ${KINDS.join(", ")}`);
    if (nonEmpty(it.url)) {
      if (!/^https:\/\//.test(it.url)) err("url must be https");
      else {
        if (ctx.allowedDomains?.length) itemAllowedProblems(it, ctx.allowedDomains).forEach(err);
        if (originals.has(normalizeUrl(it.url))) err("url is already an Original post of this topic");
      }
    }
    if (!isDateShown(it.dateShown)) err('dateShown must be YYYY-MM-DD, YYYY-MM, YYYY or "no date shown"');
    else if (olderThan12Months(it.dateShown, ctx.today)) warnings.push(`${where}: dateShown ${it.dateShown} is older than 12 months`);
    else if (it.dateShown !== NO_DATE && latestDay(it.dateShown) > ctx.today) err("dateShown is in the future");
    checkSummary(it.summary, it.evidence, it.publisher).forEach(err);
    if (nonEmpty(it.evidence) && words(it.evidence) > 15) err(`evidence is ${words(it.evidence)} words, at most 15`);
    for (const k of ["addedOn", "verifiedOn"]) {
      if (!isDate(it[k])) err(`${k} must be a YYYY-MM-DD date`);
      else if (it[k] > ctx.today) err(`${k} is in the future`);
    }
  });
  return { errors, warnings };
}
