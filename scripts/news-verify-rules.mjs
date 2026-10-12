// Pure helpers for scripts/verify-news.mjs, kept separate so the tests run without the network.
import * as cheerio from "cheerio";
import { isDateShown, NO_DATE } from "./news-rules.mjs";

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const MONTH_RE = `(${MONTHS.join("|")}|${MONTHS.map((m) => m.slice(0, 3)).join("|")})\\.?`;

/** Lowercase, straight quotes and dashes, single spaces: what evidence and page text are compared as. */
export function normalizeText(t) {
  return String(t)
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[‐-―]/g, "-")
    .replace(/[ ​-‍﻿]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** The visible text of an HTML page, without scripts, styles and templates. */
export function pageText(html) {
  const $ = cheerio.load(html);
  $("script, style, noscript, template, svg").remove();
  return $.root().text();
}

export const evidenceFound = (text, evidence) => normalizeText(text).includes(normalizeText(evidence));

const monthNumber = (name) => MONTHS.findIndex((m) => m === name || m.slice(0, 3) === name) + 1;

/** Every date the page shows, as { y, m?, d? }: ISO dates (meta tags, JSON-LD, time elements) and written ones ("June 14, 2021", "14 June 2021", "June 2021"). */
export function datesShown(html) {
  const text = normalizeText(pageText(html));
  const found = [];
  for (const m of html.matchAll(/(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/g)) found.push({ y: +m[1], m: +m[2], d: +m[3] });
  for (const m of text.matchAll(new RegExp(`\\b${MONTH_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, "g"))) found.push({ y: +m[3], m: monthNumber(m[1]), d: +m[2] });
  for (const m of text.matchAll(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+${MONTH_RE},?\\s+(\\d{4})\\b`, "g"))) found.push({ y: +m[3], m: monthNumber(m[2]), d: +m[1] });
  for (const m of text.matchAll(new RegExp(`\\b${MONTH_RE}\\s+(\\d{4})\\b`, "g"))) found.push({ y: +m[2], m: monthNumber(m[1]) });
  return found;
}

/** Does one of the page's dates agree with dateShown (to the precision dateShown gives)? "no date shown" always agrees. */
export function dateMatches(dateShown, shown) {
  if (!isDateShown(dateShown)) return false;
  if (dateShown === NO_DATE) return true;
  const [y, m, d] = dateShown.split("-").map(Number);
  return shown.some((s) => s.y === y && (m === undefined || (s.m === m && (d === undefined || s.d === d))));
}
