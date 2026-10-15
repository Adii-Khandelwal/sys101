/** decodeURIComponent that returns the text unchanged when it holds a malformed "%" escape, instead of throwing. */
export function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
