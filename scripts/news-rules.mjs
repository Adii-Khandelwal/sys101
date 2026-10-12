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

/** An allowlist entry is a host with an optional path prefix: "memcached.org" or "valkey.io/blog/". No scheme. */
export const isAllowEntry = (e) => typeof e === "string" && /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(\/[A-Za-z0-9._~\/-]*)?$/.test(e);

/**
 * Is this URL inside the allowlist? https only, no credentials in the URL, the host equal to an entry's host or a true
 * subdomain of it (never a substring match), and, when the entry has a path, the path inside that prefix.
 */
export function urlAllowed(url, entries) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" || u.username || u.password || (u.port && u.port !== "443")) return false;
  const host = u.hostname.toLowerCase();
  return entries.some((entry) => {
    const slash = entry.indexOf("/");
    const domain = (slash < 0 ? entry : entry.slice(0, slash)).toLowerCase();
    if (host !== domain && !host.endsWith(`.${domain}`)) return false;
    if (slash < 0) return true;
    const prefix = entry.slice(slash);
    return u.pathname === prefix || u.pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`);
  });
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
        if (ctx.allowedDomains?.length && !urlAllowed(it.url, ctx.allowedDomains)) err("url is not inside allowedDomains for this topic (host and path prefix)");
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
