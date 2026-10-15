import { describe, expect, it } from "vitest";
import { safeExcerpt } from "./searchExcerpt";

describe("safeExcerpt", () => {
  it("keeps the match highlight", () => {
    expect(safeExcerpt("a <mark>cache</mark> keeps a copy &amp; more")).toBe("a <mark>cache</mark> keeps a copy &amp; more");
  });

  it("turns any other tag into text", () => {
    expect(safeExcerpt('x <img src=x onerror=alert(1)> <script>y</script> <mark onclick="z">m</mark>')).toBe(
      'x &lt;img src=x onerror=alert(1)> &lt;script>y&lt;/script> &lt;mark onclick="z">m</mark>',
    );
  });
});
