---
paths:
  - "components/**/*.tsx"
  - "app/**/*.tsx"
  - "app/globals.css"
---

# Accessibility and chrome

Applies to any UI work: components, pages and styles.

## Standing rules

- WCAG AA contrast, visible focus rings, full keyboard use, 44px touch targets, real buttons, aria-live for results. Verify at 1440px and 390px.
- Every feature must work seamlessly on a phone and a laptop: build for both from the start, verify at 390px (touch) and 1440px (keyboard), light and dark, no horizontal overflow, readable wrapping, 44px taps. Wording that names a key, control or view must be true on each screen. A feature is not done until it works on mobile.
- Skeleton loaders match the final size and only stand in for client-loaded parts (no loading.tsx on content routes). Guided tours (Home, topic pages; .claude/rules/tours.md): never auto-start; the link goes once finished or skipped (sys101:tours flag, restorable on /data), a footer link stays; page clicks blocked while open; wording per view (Map, Path, phone); ends at the top; glides by transform.
- Shared header: wordmark and three-node mark linking home, the page's name beside it once its heading scrolls away (faded in from the h1; motion.md), then after a thin rule, lighter, the current section heading (the latest plain `h2` that has passed under the bar, replaced by the next, restored on the way up; decorative, aria-hidden), then the content pages (`SiteNav`: Glossary, Blogs, Great reads as small mono links (What's new is hidden for now, see news.md) from 900px, a Menu button with a dropdown below; the current page is ink, the menu closes on a page change, Escape or an outside press; the footer keeps the same links), then ThemeToggle. The page does not rubber-band at its ends (`overscroll-behavior-y: none` on html), so the sticky header and its fixed letters stay together. Footer: the site's `LogoMark` (decorative, `aria-hidden`) first, then three groups (Glossary, Posts, Take the tour | About, Terms, Privacy | Your data, Report a mistake; REPORT_EMAIL in lib/site.ts). "Back to top" appears after about 1.5 screens: floating on desktop, in the sticky progress strip on phones.
- About and Terms describe AI assistance with one shared sentence, AI_ASSISTANCE in lib/site.ts (a test checks both pages); never reword it in one place.
- No blue flash on tap: `-webkit-tap-highlight-color: transparent` on html; on touch a pressed link turns rust (`a:active` under `hover: none`), and the focus ring stays. Every list of links that sets its own colour (`color: inherit`) must also set a rust or ink hover, or the global hover is lost (checked by hand with a hover audit).
- Links are not underlined by default (app/globals.css, `a`): a link that stands alone (list, heading, label, footer, button) shows itself by layout and a colour change on hover. Links inside running sentences (`p`, `dd`, `blockquote`) keep an underline in `--ink-soft`, because rust against ink is under the 3:1 WCAG 1.4.1 asks for; the footer, `.cta`, labels and `.explain` are excepted. /reads removes every underline (`.reads-page`), the owner's choice for that page.
- Every search or filter box has the homepage search's behaviour: "/" focuses it (not while typing or with Ctrl, Cmd, Alt), Escape clears and blurs, Enter goes to the first result, words match at the start of a word (`matchesAll` in lib/searchMatch.ts), a "/" hint, `aria-keyshortcuts="/"`, an aria-live status. Use `useSlashFocus` and `focusFirstResult` (lib/useSlashFocus.ts).
- Fonts: only roman Newsreader and the two IBM Plex Mono weights are preloaded (app/layout.tsx). Italic is a separate, non-preloaded Newsreader instance, so any rule with `font-style: italic` must also set `font-family: var(--font-serif-italic), Georgia, serif` (otherwise the browser fakes an italic). A test (lib/fonts.test.ts) fails if an italic rule does not name it.
