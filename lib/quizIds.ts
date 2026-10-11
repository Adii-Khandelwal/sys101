/**
 * A quiz option's id: a short hash of its text. Saved answers store this id, not the
 * option's position, so reordering options never changes what a reader answered.
 * Editing an option's text gives it a new id; answers to the old text no longer match.
 */
export function optionId(text: string): string {
  let h = 0x811c9dc5; // FNV-1a, 32-bit
  for (const ch of text.trim()) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/** The ids of a question's options, in display order. */
export const optionIds = (options: string[]) => options.map(optionId);
