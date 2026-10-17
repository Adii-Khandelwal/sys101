// Requests every source URL in content/topics and content/learn and reports the ones that fail.
//
// Run locally:   node scripts/check-links.mjs
// In CI (weekly, see .github/workflows/link-check.yml) it also keeps exactly
// one open GitHub issue in sync with the failures:
//   - failures and no open issue  -> open one
//   - failures and an open issue  -> rewrite its body (no new issue)
//   - no failures and open issue  -> comment and close it
//   - no failures and no issue    -> do nothing
// Every run reaches the same end state for the same link results, so
// reruns never create duplicate issues.
//
// The site never fetches these URLs at runtime; this only tells us when a
// source has moved or disappeared.

import fs from "node:fs";
import path from "node:path";

const TOPICS_DIR = path.join(process.cwd(), "content", "topics");
const LEARN_DIR = path.join(process.cwd(), "content", "learn");
const LABEL = "link-check";
const TITLE = "Source links failing";
const MARKER = "<!-- sys101-link-check -->";

// Blogs often reject bare HTTP clients, so look like a browser.
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

// Statuses that usually mean "a bot was refused", not "the page is gone".
// Reported separately so they don't raise false alarms on their own.
const BLOCKED = new Set([401, 403, 406, 429, 999]);

function loadSources() {
  const posts = fs
    .readdirSync(TOPICS_DIR)
    .filter((f) => f.endsWith(".json"))
    .flatMap((f) => {
      const topic = JSON.parse(fs.readFileSync(path.join(TOPICS_DIR, f), "utf8"));
      return topic.posts.map((p) => ({ topic: topic.title, title: p.title, company: p.company, url: p.url }));
    });
  // Official sources on "Start from zero" pages.
  const learn = fs.existsSync(LEARN_DIR)
    ? fs
        .readdirSync(LEARN_DIR)
        .filter((f) => f.endsWith(".json"))
        .flatMap((f) => {
          const page = JSON.parse(fs.readFileSync(path.join(LEARN_DIR, f), "utf8"));
          return page.sources.map((s) => ({ topic: `Start from zero: ${page.slug}`, title: s.title, company: s.publisher, url: s.url }));
        })
    : [];
  return [...posts, ...learn];
}

async function request(url) {
  const res = await fetch(url, { headers: HEADERS, redirect: "follow", signal: AbortSignal.timeout(20_000) });
  await res.body?.cancel();
  return res.status;
}

/** ok | blocked | broken, retrying transient failures with backoff. */
async function check(url) {
  let last = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 2000 * attempt));
    try {
      const status = await request(url);
      if (status < 400) return { state: "ok", detail: String(status) };
      last = `HTTP ${status}`;
      if (BLOCKED.has(status)) {
        if (status !== 429) return { state: "blocked", detail: last };
        continue; // rate limited: retry
      }
      if (status < 500) return { state: "broken", detail: last }; // 404, 410: permanent
    } catch (err) {
      last = err.name === "TimeoutError" ? "timed out" : (err.cause?.code ?? err.message);
    }
  }
  return { state: last.startsWith("HTTP 429") ? "blocked" : "broken", detail: last };
}

function report(results, date) {
  const line = (r) => `- [${r.title}](${r.url}) (${r.company}, in ${r.topic}): ${r.detail}`;
  const broken = results.filter((r) => r.state === "broken");
  const blocked = results.filter((r) => r.state === "blocked");
  return [
    MARKER,
    `Weekly check on ${date}: ${broken.length} of ${results.length} source links failed.`,
    "",
    "## Failing",
    ...broken.map(line),
    ...(blocked.length
      ? ["", "## Refused the checker (probably bot protection; open by hand to confirm)", ...blocked.map(line)]
      : []),
    "",
    "Pages on the site are unaffected: digests are stored in the repo and never fetch the source.",
    "Fix by updating the URL in `content/topics`, or replace the post if it is gone. This issue updates itself each week and closes when every link passes.",
  ].join("\n");
}

async function github(method, route, body) {
  const api = process.env.GITHUB_API_URL || "https://api.github.com"; // set by Actions
  const res = await fetch(`${api}/repos/${process.env.GITHUB_REPOSITORY}${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`GitHub ${method} ${route}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function ensureLabel() {
  try {
    await github("GET", `/labels/${LABEL}`);
  } catch {
    await github("POST", "/labels", { name: LABEL, color: "9a3b1f", description: "Opened by the weekly source link check" });
  }
}

async function syncIssue(results, date) {
  const broken = results.filter((r) => r.state === "broken");
  // The issue is found by its label, so the label must exist before any issue uses it.
  await ensureLabel();
  const open = (await github("GET", `/issues?state=open&labels=${LABEL}&per_page=100`)).filter(
    (i) => !i.pull_request && i.body?.includes(MARKER),
  );
  const [issue, ...extra] = open;

  // Self-heal if duplicates ever existed: keep the oldest, close the rest.
  for (const dup of extra) await github("PATCH", `/issues/${dup.number}`, { state: "closed", state_reason: "not_planned" });

  if (broken.length) {
    const body = report(results, date);
    if (issue) {
      await github("PATCH", `/issues/${issue.number}`, { body });
      console.log(`Updated issue #${issue.number}`);
    } else {
      const created = await github("POST", "/issues", { title: TITLE, body, labels: [LABEL] });
      console.log(`Opened issue #${created.number}`);
    }
  } else if (issue) {
    await github("POST", `/issues/${issue.number}/comments`, { body: `All ${results.length} source links passed on ${date}.` });
    await github("PATCH", `/issues/${issue.number}`, { state: "closed", state_reason: "completed" });
    console.log(`Closed issue #${issue.number}`);
  } else {
    console.log("No failures and no open issue: nothing to do.");
  }
}

const sources = loadSources();
// A few at a time: dead hosts cost about a minute of retries each. Results keep the source order.
const results = new Array(sources.length);
let next = 0;
await Promise.all(
  Array.from({ length: 5 }, async () => {
    while (next < sources.length) {
      const i = next++;
      const result = await check(sources[i].url);
      results[i] = { ...sources[i], ...result };
      console.log(`${result.state.padEnd(7)} ${result.detail.padEnd(10)} ${sources[i].url}`);
    }
  }),
);

const date = new Date().toISOString().slice(0, 10);
if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) {
  await syncIssue(results, date);
} else {
  console.log("\n(Not in CI: skipping the GitHub issue.)");
}
