# Proposed CLAUDE.md edits for the design-questions area

Not applied. CLAUDE.md is owner-merged (a PR touching it is never auto-merged). Four edits; each shows the exact line before and after. Lines are in the file as of 1 Nov 2026.

## 1. Rule table (after line 51)

Before:
```
| `capstones.md` | Capstone pages (/capstones, /capstone/<slug>): schema, interactive parts, checks |
```
After:
```
| `capstones.md` | Capstone pages (/capstones, /capstone/<slug>): schema, interactive parts, checks |
| `design-questions.md` | Design questions (/design, /design/<slug>): evidence tiers, sourcing, schema, `designProblems` checks, review workflow |
```

## 2. Voice (line 83, the Voice sentence in Site feel)

Before:
```
Voice: only About speaks as "I"; every other page is neutral (no "I" or "we"), except buttons in the learner's own voice ("I have finished this topic") and the Say it in 30 seconds answers, which are what the learner would say aloud.
```
After:
```
Voice: only About speaks as "I"; every other page is neutral (no "I" or "we"), except buttons in the learner's own voice ("I have finished this topic"), the Say it in 30 seconds answers, which are what the learner would say aloud, and design pages (owner decision, 31 Oct 2026), whose model-answer text may say "we" and whose "What you say" scripts are spoken first person (`design-questions.md`).
```

## 3. Honesty rules (after line 77)

Before:
```
- A peer-reviewed paper by a company's engineering team counts as a post, labeled "paper", under the same five rules.
```
After:
```
- A peer-reviewed paper by a company's engineering team counts as a post, labeled "paper", under the same five rules.
- Design pages have a second source kind, `reference` (official docs, standards, recognised teaching sites, openly licensed material, licence recorded): explanation only, never a figure, never "a company did this"; paid, unlicensed or login-gated material is never used. Only a post or paper may back a figure or a "Worth knowing" line (`design-questions.md`).
```

## 4. Future plan (line 29 and the line after the list)

Before (line 29):
```
3. Capstones: chat is built on six sources (WhatsApp 2012 and 2021, Messenger 2014, Slack 2017 and 2020, Discord 2024; Slack 2023 belongs to `real-time-delivery`), with no figures yet for presence or read receipts; notifications is built (Patreon 2026, Pinterest 2020, Slack tracing 2023; no source on batching, de-duplication, push delivery or guarantees); ride dispatch not ready. Each new capstone is a content JSON plus research.
```
After:
```
3. Capstones: chat is built on six sources (WhatsApp 2012 and 2021, Messenger 2014, Slack 2017 and 2020, Discord 2024; Slack 2023 belongs to `real-time-delivery`), with no figures yet for presence or read receipts; notifications is built (Patreon 2026, Pinterest 2020, Slack tracing 2023; no source on batching, de-duplication, push delivery or guarantees); ride dispatch not ready. Each new capstone is a content JSON plus research.
4. Design questions (`/design`, `design-questions.md`): one pilot, the payments gateway, awaiting owner review; no other question is written until its sources are confirmed. Not built: LLD (parked until the owner names a licensed source) and the "How an interview goes" page (`docs/drafts/interview-process-sources.md`). Plan: `docs/design-questions-plan.md`.
```
