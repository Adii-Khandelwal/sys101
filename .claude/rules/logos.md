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
- **Where from:** svgl (https://github.com/pheralb/svgl, official brand SVGs, light and dark versions where the brand has them; read at the commit pinned in `SVGL_REF` in scripts/make-logos.mjs, so bump it when svgl has added a mark you need), else Simple Icons (CC0 icon files, filled with the brand's own colour, viewBox cropped to the drawn shape so wide marks keep their proportions), else a company's own brand-kit file when neither has the mark (`local` and `localDark` in `content/logos.json`: the originals stay unaltered in `content/logo-sources/`; the copy drops the XML prolog and editor comment and crops the viewBox; CrowdStrike's Falcon symbol from crowdstrike.com/about-us/brand/). Marks are trademarks of their owners.
- **Rules:** never recolour or redraw a mark; use the symbol, not a wordmark that repeats the name beside it; `CompanyLogo` puts it in a fixed 32x22 slot with `object-fit: contain`, so proportions are kept and nothing shifts. A mark with a dark version is drawn twice and CSS picks one per theme. A company with no mark gets an empty slot so names line up. Alt text is "<name> logo".
- **A new company:** `node scripts/make-logos.mjs add "Company Name" [domain.com]` looks for its mark in order (svgl by title, Simple Icons by title, then Hunter by the domain you give: https://logos.hunter.io/<domain>, no key, a raster trimmed to a 128px WebP), adds the entry to `content/logos.json` and rebuilds. `lib/logos.test.ts` (it counts topic posts, /reads and capstone sources) fails with that exact command until a new company has a mark or a reason in `withoutLogo`, so a new post never ships without one. Check a Hunter result on both themes: it keeps its own background.
- **Without a mark:** `withoutLogo` in `content/logos.json`, with the reason (WhatsApp today). Two entries carry a note in `logos.json` to read before relying on them: Amazon uses the AWS mark (svgl has no Amazon.com mark, and Simple Icons removed Amazon and AWS because no permission was confirmed), and Discord's branding page asks for permission before uses it does not list, which a sources list is not; it is shown at the site owner's decision.
- **Checked:** `lib/logos.test.ts` (every organization has a mark or a reason, files exist, are small, are not scripts, and match their stated proportions).
- **Brand rules read (for the reader of this file, not shown on the site):** GitHub permits its logo in content about GitHub, unaltered and less prominent than your own brand; Figma permits identifying Figma unaltered; Discord needs permission beyond its listed uses; CrowdStrike publishes its logo kit for download and states no third-party rules on that page; Meta, Netflix, Uber and Dropbox pages did not state third-party rules in what could be read; WhatsApp's page (about.meta.com/brand/resources/whatsapp) says to use only the logos from its own brand site, so WhatsApp has no mark here; Patreon's brand page (read 24 Oct 2026) says to use its marks only in digital use and fairly, and does not address third-party source lists; others publish none. If an owner asks, remove its entry from `logos` and add it to `withoutLogo`.
