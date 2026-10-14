---
paths:
  - "components/CompanyLogo.tsx"
  - "content/logos.json"
  - "scripts/make-logos.mjs"
  - "lib/logoFiles.ts"
  - "lib/organization.ts"
  - "lib/posts.ts"
  - "public/logos/**"
---

# Company logos

Applies when editing company marks, the logo component or the logo pipeline.

## Specification

Marks beside company names, wherever the name stands as a label: the homepage "Companies we learn from" list and the daily figure; /posts (company headings and column); on a topic page the post header ("GitHub · December 2023"), the Original posts list, the In short figures, the left rail ("Uber post") and What's new; and the Background page. Not inside running prose or figure text. `CompanyLogo` takes `size="sm"` (20x16, for mono labels), `even` (homepage row: equal drawn area, 36x24 cap) and `bare` (draw nothing for a company without a mark, used where most names have none, such as What's new publishers).

- **Source of truth:** `content/logos.json` (company name as the data spells it, after `organization()` merges Amazon's two credits and folds Facebook into Meta). `node scripts/make-logos.mjs` copies each mark into `public/logos/` and writes `lib/logoFiles.ts` (path, proportions, source). Idempotent; the site never fetches a logo at runtime.
- **Where from:** svgl (https://github.com/pheralb/svgl, official brand SVGs, light and dark versions where the brand has them), else Simple Icons (CC0 icon files, filled with the brand's own colour, viewBox cropped to the drawn shape so wide marks keep their proportions). Marks are trademarks of their owners.
- **Rules:** never recolour or redraw a mark; use the symbol, not a wordmark that repeats the name beside it; `CompanyLogo` puts it in a fixed 32x22 slot with `object-fit: contain`, so proportions are kept and nothing shifts. A mark with a dark version is drawn twice and CSS picks one per theme. A company with no mark gets an empty slot so names line up. Alt text is "<name> logo".
- **A new company:** `node scripts/make-logos.mjs add "Company Name" [domain.com]` looks for its mark in order (svgl by title, Simple Icons by title, then Hunter by the domain you give: https://logos.hunter.io/<domain>, no key, a raster trimmed to a 128px WebP), adds the entry to `content/logos.json` and rebuilds. `lib/logos.test.ts` fails with that exact command until a new company has a mark or a reason in `withoutLogo`, so a new post never ships without one. Check a Hunter result on both themes: it keeps its own background.
- **Without a mark:** `withoutLogo` in `content/logos.json`, with the reason (none today). Two entries carry a note in `logos.json` to read before relying on them: Amazon uses the AWS mark (svgl has no Amazon.com mark, and Simple Icons removed Amazon and AWS because no permission was confirmed), and Discord's branding page asks for permission before uses it does not list, which a sources list is not; it is shown at the site owner's decision.
- **Checked:** `lib/logos.test.ts` (every organization has a mark or a reason, files exist, are small, are not scripts, and match their stated proportions).
- **Brand rules read (for the reader of this file, not shown on the site):** GitHub permits its logo in content about GitHub, unaltered and less prominent than your own brand; Figma permits identifying Figma unaltered; Discord needs permission beyond its listed uses; Meta, Netflix, Uber and Dropbox pages did not state third-party rules in what could be read; others publish none. If an owner asks, remove its entry from `logos` and add it to `withoutLogo`.
