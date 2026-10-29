/**
 * Where margin notes sit: each wants a top (beside the line its term is in), but none may overlap the one before.
 * `desired` and `heights` are in order; `limit` is the section's height. Notes are pushed down past the previous one (plus `gap`);
 * when the last would run past `limit`, the group is pulled back up as far as the gaps allow. `bottom` is where the last note ends,
 * so a caller can make the section at least that tall and never let notes of two sections meet.
 */
export function stackTops(desired: number[], heights: number[], limit = Infinity, gap = 8): { tops: number[]; bottom: number } {
  const n = desired.length;
  const tops: number[] = [];
  const forward = (want: number[]) => {
    let floor = 0;
    for (let i = 0; i < n; i++) {
      tops[i] = Math.max(want[i], floor);
      floor = tops[i] + heights[i] + gap;
    }
  };
  forward(desired);
  if (n && tops[n - 1] + heights[n - 1] > limit) {
    for (let i = n - 1; i >= 0; i--) tops[i] = Math.min(tops[i], (i === n - 1 ? limit : tops[i + 1] - gap) - heights[i]);
    for (let i = 0; i < n; i++) tops[i] = Math.max(tops[i], 0);
    forward([...tops]);
  }
  return { tops, bottom: n ? tops[n - 1] + heights[n - 1] : 0 };
}
