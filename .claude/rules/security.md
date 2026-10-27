---
paths:
  - "next.config.ts"
  - "lib/securityHeaders.ts"
  - "lib/diagramCheck.ts"
  - "lib/httpsUrl.ts"
  - "lib/searchExcerpt.ts"
  - "lib/safeDecode.ts"
  - "lib/lessonStore.ts"
  - ".github/workflows/**"
---

# Security

Applies to response headers, anything injected as HTML, URLs taken from content, imports and the workflows. Findings came from the audit in run-1 (a source-only quick pass; hardening, no confirmed vulnerability).

## Specification

- **Headers** (`lib/securityHeaders.ts`, sent by `next.config.ts` in production only): a Content Security Policy, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. The policy allows only the site's own origin, plus `frame-src https://www.youtube-nocookie.com` for the video facade and `'wasm-unsafe-eval'` for Pagefind. `'unsafe-inline'` stays for scripts and styles because Next's and React's inline code needs it, so the policy cannot stop an injected inline script: the HTML sinks below do that. A new third-party origin means a conscious edit here, a test change and a note in Privacy. Not applied under `next dev`. `/_vercel/insights/script.js` is not served by a local `next start`, so `check:tour` reports it there (a 404, and a refused script with nosniff).
- **Diagram SVG** is injected as HTML, so `checkDiagram` (lib/diagramCheck.ts, used by topics and learn pages) allows only drawing elements (`svg title desc defs marker g path rect circle ellipse line polyline polygon text tspan`) and a fixed attribute list, with no event handlers, links, styles or external `url()`. A new element or attribute a diagram needs is added to those lists on purpose.
- **Search excerpts** go through `safeExcerpt` (lib/searchExcerpt.ts): only `<mark>` and `</mark>` survive.
- **URLs from content** (posts, `stillCitedBy`, learn sources, reads) pass `httpsUrlProblem` (lib/httpsUrl.ts): https, no credentials. News URLs have their own stricter rules (scripts/news-rules.mjs).
- **Hash decoding** uses `safeDecode` (lib/safeDecode.ts), never a bare `decodeURIComponent` on `location.hash` (the inline script in PostsIndex has its own try/catch).
- **Progress**: `parseProgress` and `validateImport` skip a `__proto__` key; an import over `MAX_IMPORT_CHARS` (1,000,000) is refused before it is read.
- **Workflows**: every `uses:` is pinned to a full commit hash with the tag in a comment (`lib/workflows.test.ts` checks). The news workflow checks that the pull request's head is still the commit from the event after it lists the files, and auto-merges with `--match-head-commit` (`lib/newsGuard.test.ts`). Bump a pin by looking up the tag's commit (`git ls-remote https://github.com/<owner>/<action> refs/tags/<tag>`). `.github/dependabot.yml` opens a weekly pull request for newer actions and for npm minor and patch releases only (majors are ignored: eslint 10 broke `npm install` against eslint-config-next, which allows eslint 9 at most, and sigma 4 broke the type check, and both stopped every deployment; upgrade a major by hand, with `npm install`, tsc, tests and a build) (an action bump touches only workflow files, so the news guard leaves it alone). `ci.yml` runs tsc, lint and tests on every pull request with `contents: read` only; it has no `npm audit` step because `--audit-level=high` reports 5 high findings on today's tree (the eslint-config-next chain) and would fail every pull request. `automerge.yml` runs on `pull_request` (never `pull_request_target`), with `permissions: {}` at the top and `contents`/`pull-requests: write` only on its one job, for owner-opened same-repository branches; it runs `gh pr merge --auto` and never checks out pull request code, and it skips any pull request touching `.github/`, `.claude/` or `CLAUDE.md`.
- **Scripts**: `python3 -I` wherever a script runs Python; `make-logos` reads svgl at the commit in `SVGL_REF`.
- Not fixed on purpose: `.claude/settings.json` allows `npm run *` and `node scripts/*`, and the guard hooks match substrings. Both are conveniences for the owner's own session, not a boundary; narrowing them would stop routine work.
- Run the audit again after a change to a trust boundary (a new HTML sink, a server route, a new workflow trigger).
