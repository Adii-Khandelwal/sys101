# README screenshots and numbers

The README's images are in this folder, each in a light and a dark file (`<picture>` picks one by the reader's colour scheme).
They are real screenshots of a production build (`NEXT_DIST_DIR=.next-build npx next build`, then `next start`), taken with
Playwright at 1440px wide, reduced palette, with a one-pixel frame in the page's own `--rule` colour:

- `map-*.png`: the homepage map section. The map is wider than the page (it scrolls sideways), so the capture widens the
  map's wrapper with one injected style to show all of it. Nothing else on the page is altered.
- `topic-*.png`: the top of `/topic/caching`, 1440x1000.
- `learn-*.png`: the top of `/topic/dns/learn`, 1440x1000.

Retake them when the header, map or those page tops change look.

## Numbers

Every count in the README sits between marker comments, `<!--stat:sources-->36<!--/stat-->`. They are computed, never typed:

```
npm run readme:stats    # rewrite the numbers from content/
npm run readme:check    # exit 1 if they have drifted
```

`scripts/readme-stats.mjs` imports two `.ts` files from `lib/` directly, which needs Node 22.18 or newer (`.nvmrc` is 24; `engines` still says 20.9 for the site itself). It uses the site's counting rules: a source is one distinct URL, a paper is marked in `ageNote`, a
documentation page has an edition, and Amazon and AWS, Facebook and Meta count as one organization each. `lib/readme.test.ts`
fails when the README numbers differ from the content, when the script disagrees with the site's own counters, and when the
README's AI-assistance sentence differs from `AI_ASSISTANCE` in `lib/site.ts`. After adding a topic or post, run
`npm run readme:stats` and commit the change.
