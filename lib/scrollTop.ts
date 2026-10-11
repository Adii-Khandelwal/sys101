// Pure rules for the logo and "Back to top" scroll behaviour.

/** Shown once the page is scrolled more than 1.5 screens down; hidden again near the top. */
export function showBackToTop(scrollY: number, viewport: number, wasShown: boolean) {
  // A little hysteresis, so the button does not flicker around the threshold.
  return wasShown ? scrollY > viewport : scrollY > viewport * 1.5;
}

/** Smooth unless the reader prefers reduced motion, in which case it jumps. */
export const scrollBehavior = (reduced: boolean): ScrollBehavior => (reduced ? "auto" : "smooth");

/** The logo scrolls to top on the homepage and navigates everywhere else. */
export const logoScrollsInPlace = (pathname: string) => pathname === "/";
