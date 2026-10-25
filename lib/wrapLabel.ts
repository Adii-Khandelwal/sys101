/** Characters that fit on one line of a capstone diagram box (200px wide, 15px serif, with side padding). */
export const LABEL_LINE_CHARS = 25;
export const LABEL_MAX_LINES = 3;

/** Greedy word wrap for an SVG label, which cannot wrap by itself. */
export function wrapLabel(label: string, max = LABEL_LINE_CHARS): string[] {
  const lines: string[] = [];
  for (const word of label.split(" ")) {
    const last = lines[lines.length - 1];
    if (last !== undefined && last.length + 1 + word.length <= max) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}
