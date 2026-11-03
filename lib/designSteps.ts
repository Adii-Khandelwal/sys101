// No node imports here: components read the section list from this file.
/** The twelve sections of a design page, in the only order a page may list them. Every section but `general-tips` carries its own ask, say and tip. */
export const STEPS = [
  { id: "general-tips", label: "General tips" },
  { id: "clarify", label: "Clarify the problem" },
  { id: "requirements", label: "Requirements" },
  { id: "entities", label: "Entities" },
  { id: "api", label: "API" },
  { id: "data-model", label: "Data model" },
  { id: "high-level", label: "High-level design" },
  { id: "deep-dives", label: "Deep dives" },
  { id: "failure-modes", label: "Failure modes" },
  { id: "against-the-grain", label: "Against the grain" },
  { id: "strong-answer", label: "A strong answer" },
  { id: "mistakes", label: "Common mistakes" },
] as const;
export type StepId = (typeof STEPS)[number]["id"];
/** The word limits of the three round strings, checked by the build. */
export const ROUND_LIMITS = { ask: [6, 40], say: [25, 140], tip: [8, 45] } as const;

/** The sections that hold a list of blocks (deep-dives may too; high-level also holds stages). */
export const SECTIONS_WITH_BLOCKS = ["general-tips", "clarify", "requirements", "entities", "api", "data-model", "high-level", "failure-modes", "against-the-grain"] as const;
/** Page anchors that are not sections, kept free of diagram ids. */
export const PAGE_ANCHORS = ["question", "answer", "worth-knowing", "sources"] as const;
