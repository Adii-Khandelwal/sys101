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
- Animate only transform, opacity, and color. No bounce or elastic, no layout shift, no staggered or scroll-triggered effects. One exception: the header name (homepage wordmark, topic title) arrives one letter at a time as the page heading scrolls under the header, driven by scroll position over 120px (lib/letterRise.ts: opacity and a 10px translateY only, requestAnimationFrame, passive listener). Reduced motion: it is simply there or not. Press feedback scale 0.97.
- Under prefers-reduced-motion, change instantly or fade in 80ms or less. Never fade in the page itself on load: it delays LCP. The one exception is the Map node-open transition (.claude/rules/graph.md): a fade-in after a plain click or tap on a Map node, never on a direct load.
