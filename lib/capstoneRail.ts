/** The sections the capstone rail lists, in page order. The ids are the section ids on the page. */
export const RAIL_SECTIONS = [
  { id: "brief", label: "Brief" },
  { id: "design", label: "Design it" },
  { id: "size", label: "Size it" },
  { id: "system", label: "System" },
  { id: "break", label: "Break it" },
  { id: "differ", label: "Compare" },
  { id: "check", label: "Quiz" },
] as const;

/** Reserved keys in the stored picks (decision ids start with a letter, so they never clash). */
export const TOUCHED = { size: "_size", break: "_break" } as const;
export const quizKey = (i: number) => `_q${i}`;

/** The small text beside a section label, or "" when there is nothing to say yet. Derived from the stored picks only. */
export function railStates(picks: Record<string, number>, decisionIds: string[], quizLength: number): Record<string, string> {
  const has = (k: string) => Number.isInteger(picks[k]) && picks[k] >= 0;
  const decided = decisionIds.filter(has).length;
  const answered = Array.from({ length: quizLength }, (_, i) => quizKey(i)).filter(has).length;
  return {
    design: decided ? `${decided} of ${decisionIds.length} answered` : "",
    size: has(TOUCHED.size) ? "touched" : "",
    break: has(TOUCHED.break) ? "touched" : "",
    check: answered === quizLength && quizLength > 0 ? "done" : answered ? `answered ${answered} of ${quizLength}` : "",
  };
}

/** Sections the reader can complete: the ones the progress bar counts. */
export const TRACKED = ["design", "size", "break", "check"] as const;

/** Which tracked sections are finished: every decision answered, Size it and Break it touched, every question answered. */
export function railDone(picks: Record<string, number>, decisionIds: string[], quizLength: number): string[] {
  const has = (k: string) => Number.isInteger(picks[k]) && picks[k] >= 0;
  const done = [];
  if (decisionIds.length && decisionIds.every(has)) done.push("design");
  if (has(TOUCHED.size)) done.push("size");
  if (has(TOUCHED.break)) done.push("break");
  if (quizLength && Array.from({ length: quizLength }, (_, i) => quizKey(i)).every(has)) done.push("check");
  return done;
}
