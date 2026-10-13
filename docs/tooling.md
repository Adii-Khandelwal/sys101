# Tooling details

Moved from CLAUDE.md, "Working in this repo".

- `npm run verify:figures` fetches every source with curl (PDFs through pdftotext or pypdf, blocked pages through the Wayback CDX API, marked "(archive copy)") and writes docs/verification-log.md (figure, URL, nearest heading, found or NOT FOUND). Needs the network, so it never runs in the build.
- `scripts/check-diagram-overflow.mjs` runs after the build (and as `npm run check:diagrams`): it renders each diagram SVG in headless Chromium and fails if a label's box spills past its rect. It skips when Chromium is absent (`npx playwright install chromium`); Playwright is a devDependency.
- `npm run build` also builds the Pagefind index into `public/pagefind` (git-ignored). Under `npm run dev`, run `npm run search:index` instead.
