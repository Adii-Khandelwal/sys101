# Tooling details

Moved from CLAUDE.md, "Working in this repo".

- `npm run verify:figures` fetches every source with curl (PDFs through pdftotext or pypdf; a page that refuses curl through the Wayback CDX API, marked "(archive copy)", and then through headless Chromium, marked "(browser copy)") and writes docs/verification-log.md (figure, URL, nearest heading, result). It checks the numbers table, problem, constraints, walkthrough, trade-offs, failures, takeaways and the numbers' meanings. A figure with a lone digit or a number written as a word cannot be judged by a script: the script looks for the other spelling next to the same noun, and anything left says HAND CHECK until a person has read the source and recorded the verdict in docs/hand-checks.json (key `<post id>|<figure as written>`, with a short note). `VF_DUMP=<dir>` writes each page's text for reading. Needs the network, so it never runs in the build.
- `scripts/check-diagram-overflow.mjs` runs after the build (and as `npm run check:diagrams`): it renders each diagram SVG in headless Chromium and fails if a label's box spills past its rect. It skips when Chromium is absent (`npx playwright install chromium`); Playwright is a devDependency.
- `npm run build` also builds the Pagefind index into `public/pagefind` (git-ignored). Under `npm run dev`, run `npm run search:index` instead.
