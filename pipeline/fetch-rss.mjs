// shortcut: parked on purpose for the owner's future goals (docs/ideas.md, "Kept on purpose"); do not delete it in a review.
// Fetch engineering-blog RSS feeds and extract article text.
// Usage: npm run pipeline:fetch

import Parser from "rss-parser";
import * as cheerio from "cheerio";

const FEEDS = [
  // "https://blog.cloudflare.com/rss/",
];

async function main() {
  const parser = new Parser();
  // TODO: for each feed, parse items, fetch each article, extract body text
  // with cheerio, and write candidates to pipeline/.cache/ for summarization.
  void parser;
  void cheerio;
  void FEEDS;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
