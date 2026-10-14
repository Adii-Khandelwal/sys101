# Topic file shape and pre-commit list

Create `content/topics/<slug>.json` and, with it, `content/learn/<slug>.json`: a topic is not done until its learn page exists. Topics use the lesson format (`why`, `mentalModel`, `howItWorks`, `workedExample`, mistakes, a 5-to-8 question `quiz`, `posts`, a `comparison`, and 2-to-3 `exercises`); the older `primer`/`quiz`/`exercise` format is still supported for non-lesson topics. A shortened lesson example:

```json
{
  "slug": "cdn",
  "title": "CDNs",
  "shortTitle": "optional, used in page titles when the full title would pass 60 characters",
  "group": "Scaling",
  "interviewRelevance": "optional: core, common, or niche; shown as a marker on the topic page",
  "concept": "Two to four sentences on the idea itself.",
  "prerequisites": ["dns", "caching"],
  "lesson": {
    "why": { "outcome": "After this you can ...", "body": "..." },
    "mentalModel": { "outcome": "After this you can ...", "body": "...", "diagram": "<svg viewBox=\"0 0 560 300\"><title>...</title>...</svg>" },
    "howItWorks": { "outcome": "After this you can ...", "steps": [{ "step": "...", "explanation": "..." }], "diagram": "<svg viewBox=\"0 0 560 300\"><title>...</title>...</svg>" },
    "workedExample": { "outcome": "After this you can ...", "steps": [{ "step": "...", "explanation": "..." }], "diagram": "<svg viewBox=\"0 0 560 300\"><title>...</title>...</svg>" },
    "mistakesOutcome": "After this you can ...",
    "checkOutcome": "After this you can ...",
    "quiz": [{ "question": "...", "options": ["..."], "correct": 0, "why": "...", "wrong": ["..."], "teaches": "why" }],
    "postsOutcome": "After this you can ...",
    "differOutcome": "After this you can ...",
    "exercisesOutcome": "After this you can ...",
    "exercises": [{ "level": "apply", "prompt": "...", "answer": "...", "tradeoffs": "...", "wrongAnswers": ["..."], "teaches": "how" }],
    "next": { "outcome": "After this you can ...", "body": "..." }
  },
  "posts": [{
    "id": "cdn-cloudflare", "title": "Post title", "url": "https://...", "company": "Company",
    "verifiedOn": "2026-10-11", "published": "2024-03-14",
    "digest": {
      "problem": "...", "constraints": "...",
      "walkthrough": [{ "step": "...", "explanation": "..." }],
      "diagram": "<svg viewBox=\"0 0 560 300\"><title>...</title>...</svg>",
      "numbers": [{ "value": "...", "meaning": "..." }],
      "tradeoffs": { "chosen": "...", "rejected": "...", "why": "..." },
      "failures": "...", "takeaways": "..."
    }
  }],
  "comparison": "How the posts' approaches differ and why.",
  "glossary": [{ "term": "...", "definition": "..." }],
  "mistakes": ["...", "...", "..."]
}
```

A new company also needs a logo (`node scripts/make-logos.mjs add`). With Claude Code, the `add-topic` and `add-post` skills walk through all of this.

Before committing:

- Every prerequisite already exists as a topic.
- Quiz answers are spread across positions, and explanations quote option text instead of naming letters.
- "Where they differ" is 2 to 3 short paragraphs: what the posts share, where they diverge, and what the evidence is.
- The post passes the selection rules above.
- The digest is written in your own words from the post itself, with no copied passages.
- Every number is checked against the post. Never estimate or round in a way the post does not.
- A post over five years old has an `ageNote` saying why it still applies, without claiming details still hold unless a source you opened says so.

