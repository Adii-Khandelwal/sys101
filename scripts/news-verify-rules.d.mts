export type ShownDate = { y: number; m?: number; d?: number };
export function normalizeText(t: string): string;
export function pageText(html: string): string;
export function evidenceFound(text: string, evidence: string): boolean;
export function datesShown(html: string): ShownDate[];
export function dateMatches(dateShown: string, shown: ShownDate[]): boolean;
