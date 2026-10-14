---
paths:
  - "app/**"
  - "lib/site*.ts"
  - "scripts/check-seo.mjs"
  - "public/**"
---

# SEO

Applies to pages, metadata and the SEO check.

## Standing rules

- One absolute canonical per page from SITE_URL in lib/site.ts, no query strings. Set metadata through pageMeta(), which adds Open Graph and Twitter text tags.
- Unique title under 60 characters with the " · sys101" suffix (the homepage's title is just "sys101", so the browser tab stays short; its description carries the pitch) (optional topic `shortTitle`, used by pageTitle in lib/site.ts). Description under 155, ending at a sentence or clause boundary with no ellipsis (metaDescription), generated from content.
- Exactly one H1 and no skipped heading levels. Content must be in the HTML and render without JavaScript.
- app/sitemap.ts lists every indexable page with lastmod from content dates (PAGE_DATES for About, Glossary, Terms, Privacy). /data and 404 are noindex. /glossary lists every topic's terms (grouped, backlinked), a slash-to-focus filter and a contents rail (phone strip), all server-rendered for Pagefind.
- JSON-LD only where it matches visible content: BreadcrumbList on topic and learn pages, LearningResource on topic pages. No FAQ schema.
- No raster image without alt, width, and height. SVGs need role="img" and a name, or aria-hidden.
- Social image: public/og.png (1200x630, wordmark and tagline on --paper) from scripts/make-og.mjs, committed; pageMeta sets og:image and twitter summary_large_image. Also apple-touch-icon.png and theme-color.
- scripts/check-seo.mjs runs after every build and fails it on any of these.
