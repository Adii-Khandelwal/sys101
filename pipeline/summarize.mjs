// Summarize fetched articles with Gemini Flash and attach them to topics in
// content/topics/*.json.
// Usage: GEMINI_API_KEY=... npm run pipeline:summarize

import { GoogleGenAI } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-latest";

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  // TODO: read candidates from pipeline/.cache/, ask the model for a
  // summary and a topic slug, then append { title, url, company, summary }
  // to the matching topic's posts[].
  void ai;
  void MODEL;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
