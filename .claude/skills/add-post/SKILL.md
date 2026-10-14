---
name: add-post
description: Choose, verify and save an engineering post, paper or doc as a source on a sys101 topic. Use when the user names a post URL, asks for sources for a topic, or wants a figure checked against its source.
---

# Add a post

Read `CLAUDE.md` "Post selection" and "Honesty rules", and `.claude/rules/topic-pages.md`. Never use a post you have not opened.

1. **Open it.** The fetch tool returns a model-written reading, not the page. Fetch the raw page with curl (browser-like headers if blocked; a PDF through `pdftotext`; a blocked page through the Wayback CDX API, marked "(archive copy)").
2. **Judge it against the five rules** (specific numbers, honest trade-offs, still relevant with its year if older than about five years, a credible engineering team at scale, transferable to one graph node). A peer-reviewed company paper counts, labelled "paper". If it fails, say so and find another.
3. **Show the user** the URL, the company and why it passed, and wait. Candidate tables: at most 6 columns, figures only.
4. **Write the digest** in your own words (problem, constraints, walkthrough, an original diagram with a title, numbers, trade-offs, failures, takeaways). Never copy passages or embed the blog's diagram. Fill `verifiedOn`, `published` (or `no date shown` plus `edition`), and `ageNote` for an old post (a paper's says "This is a research paper, not a company blog post").
5. **Check every figure** in the raw page text. Drop any you cannot find and list the drops in the reply. `npm run verify:figures` repeats this over the network. A single-digit value is checked by hand (`docs/hand-checks.json`).
6. **Logo.** A new company needs a mark: `node scripts/make-logos.mjs add "<Company>" [domain]`; `lib/logos.test.ts` fails without it. Check the result on both themes.
7. **Interactive figure** only where the source gives a mechanism: `.claude/rules/figures.md`.
8. **Run** `npm test` and a build; run `npm run readme:stats` (the README counts sources and organizations from the topic files).
