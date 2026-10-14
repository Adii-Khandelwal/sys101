---
paths:
  - "app/globals.css"
  - "components/**/*.tsx"
  - "lib/motion*.ts"
---

# Motion

Applies to any CSS or component animation.

## Standing rules

- One tokens file: 120ms fast, 200ms base, 320ms slow. Ease-out cubic-bezier(0.23, 1, 0.32, 1) for entering or responding, ease-in-out for on-screen movement.
- Animate only transform, opacity, and color. No bounce or elastic, no layout shift, no staggered or scroll-triggered effects. One exception: the page heading's letters fly into the top bar (the homepage's "sys101" into the wordmark; on every other page with a plain-text h1, its title into the header beside the logo), one letter after another, driven by scroll position over 120px and eased (the shown progress follows the scroll position with a 70ms time constant, so a wheel jump is not a letter jump; layout is measured once and on resize or font load, never per frame) (lib/letterRise.ts: transform only, translate and scale about each letter's centre, requestAnimationFrame, passive listener). The heading is split into letters at runtime and restored on cleanup; the header's own letters are invisible targets; once every letter has arrived they are pinned with position: fixed (re-aiming letters that scroll with the page jitters), and a letter whose target lies past the header's right edge fades out instead. Reduced motion: the name is simply there or not. Press feedback scale 0.97.
- Under prefers-reduced-motion, change instantly or fade in 80ms or less. Never fade in the page itself on load: it delays LCP. The one exception is the Map node-open transition (.claude/rules/graph.md): a fade-in after a plain click or tap on a Map node, never on a direct load.
