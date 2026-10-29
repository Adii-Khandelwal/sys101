# Phase 0 spike B: fonts (28 Oct 2026)

Method: production build in a throwaway worktree (cloned node_modules, because Turbopack rejects a symlinked one), `next/font/google` fetched fine (network was available). Playwright Chromium, cold cache, median of 5, 3.5 s settle. Mobile 390x844 at DPR 3 with CDP throttling (1.6 Mbps, 150 ms RTT, 4x CPU); desktop 1440x900 unthrottled. "New" = Libre Caslon Text (400, 700, plus a non-preloaded 400 italic instance) for body and `--font-serif`, Libre Caslon Display 400 for h1-h3, Cabin (variable, replaces `--font-mono`).

| Page / viewport | LCP base | LCP new | CLS base | CLS new | Font bytes base | Font bytes new |
| - | - | - | - | - | - | - |
| Home, mobile | 732-736 ms | 856-864 ms | 0.0076 | 0 | 292 KB (4 files) | 96 KB (5 files) |
| Topic (caching), mobile | 844-856 ms | 960-976 ms | 0.0121 | 0 | 292 KB | 96 KB |
| Home, desktop | 32 ms | 28 ms | 0 | 0 | 292 KB | 96 KB |
| Topic, desktop | 40 ms | 36 ms | 0 | 0 | 292 KB | 96 KB |

Two runs agree, so the mobile difference is real: new LCP is about 120 ms (15%) slower on throttled mobile despite 3x fewer bytes. Cause not isolated (likely five font files competing, or the heading font swapping in). Desktop LCP of about 30 ms looks like an early small element (splash or text before webfont), so it says nothing about fonts; treat desktop as unmeasured. CLS improves (the Newsreader fallback metrics shift slightly today). Bytes are the woff2 actually fetched on the page (latin subset; the build also emits latin-ext and other subset files, about 1.2 MB in `static/media` for baseline, not downloaded).

## Font facts (from next/font font-data.json)
- Libre Caslon Display: 400 normal only. No italic, no 500/600.
- Libre Caslon Text: 400 and 700, normal and italic. No 500/600, no variable axis. Site uses `font-weight` 500 (10 rules) and 600 (3 rules): these snap to 400/700 or synthesise; each needs a decision.
- Cabin: variable 400-700 with wdth axis, italic available. Covers the 500/600 label weights.
- Italic exists only in Text, so italic headings (Display) would be faked.

## Font-coupled files and what must change
- `app/layout.tsx`: replace Newsreader (roman + separate italic, `preload:false`, axes opsz) and IBM_Plex_Mono (400, 500); add a Display instance and variable. Preloads: today roman Newsreader plus two Plex weights; new preloads would be Text 400/700, Display, Cabin. Preload only what the first screen uses.
- `lib/fonts.test.ts`: regex requires every `font-style: italic` rule (10 in globals.css) to contain `var(--font-serif-italic)`. Keep the variable name pointing at Text italic, or rename in test and CSS together.
- `app/globals.css`: 20 `font-family: var(--font-serif...)` rules; 32 `font-mono` rules (plan's 32 verified: 32 lines, 32 `var(--font-mono)` uses); 10 italic rules; heading rules at lines 84-112 (h1/h2/h3) need the Display var; weights 500/600 rules need review; `root` size and rem sizes may need retuning since Caslon runs wider/lower x-height than Newsreader. Plan says no tracked all-caps eyebrows or mono labels, so the 32 mono rules need `letter-spacing`/`text-transform` removal too, not only the family swap.
- `scripts/check-diagram-overflow.mjs` (lines 7, 35-41, 59-61): imports Newsreader and IBM Plex Mono from Google CSS and calls `document.fonts.load` for them; must load Caslon Text/Display/Cabin so label widths match production. SVG diagram labels set in these fonts will measure wider; expect overflow failures to fix.
- `scripts/make-og.mjs` (lines 3, 27): comment and `var(--font-mono)` label with uppercase and tracking; OG PNGs are committed, regenerate after the redesign.
- `.claude/rules/accessibility-and-chrome.md` line 26 (font rule) and `offline.md` line 15 (warm-up reads stylesheets for fonts, so `check:offline` must be rerun; new woff2 names are discovered automatically): rule text to update later (not edited now).
- Also check components with inline font styles/SVG text: grep in components/app/lib found only the files above, so none.

## Verdict
Do not hold, but flag. CLS and bytes pass; LCP is about 120 ms slower on throttled mobile (plan says "LCP not worse than today", Phase 8). Before Phase 8: retry with fewer preloads (Text 400 plus Display only, Cabin not preloaded), `display: optional/swap` choice, and drop the 700 weight if unused. If LCP still lags, accept or keep Newsreader for body. Resolve the 500/600 weight gap in Libre Caslon with the designer. Not checked: Safari, real phone, Lighthouse.
