// Checks every topic's pullQuote against the live page of its post: the sentence must appear word for word
// (tags removed, entities decoded, whitespace collapsed, nothing else changed). Needs the network, so it never runs in the build.
import fs from "node:fs";

const H = { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15", accept: "text/html,application/xhtml+xml", "accept-language": "en-US,en;q=0.9" };
const text = (h) =>
  h.replace(/<script\b[\s\S]*?<\/script\b[^>]*>/gi, " ").replace(/<style\b[\s\S]*?<\/style\b[^>]*>/gi, " ").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#0?39;|&#x27;/g, "'").replace(/&rsquo;|&#8217;/g, "’").replace(/&lsquo;|&#8216;/g, "‘")
    .replace(/&ldquo;|&#8220;/g, "“").replace(/&rdquo;|&#8221;/g, "”").replace(/&amp;/g, "&").replace(/\s+/g, " ");

let bad = 0;
for (const f of fs.readdirSync("content/topics")) {
  const t = JSON.parse(fs.readFileSync(`content/topics/${f}`, "utf8"));
  if (!t.pullQuote) continue;
  const post = t.posts.find((p) => p.id === t.pullQuote.postId);
  if (!post) { bad++; console.log(`NO POST ${t.slug}`); continue; }
  const want = t.pullQuote.text.replace(/\s+/g, " ").trim();
  let ok = false;
  try {
    const r = await fetch(post.url, { headers: H, redirect: "follow", signal: AbortSignal.timeout(60000) });
    ok = r.ok && text(await r.text()).includes(want);
  } catch {}
  if (!ok) bad++;
  console.log(`${ok ? "ok     " : "MISSING"} ${t.slug} ${post.url}`);
}
if (bad) process.exit(1);
