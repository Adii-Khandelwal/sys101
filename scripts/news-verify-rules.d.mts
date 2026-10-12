export type ShownDate = { y: number; m?: number; d?: number };
export function normalizeText(t: string): string;
export function pageText(html: string): string;
export function evidenceFound(text: string, evidence: string): boolean;
export function datesShown(html: string): ShownDate[];
export function dateMatches(dateShown: string, shown: ShownDate[]): boolean;
export function fetchAllowed(url: string, entries: { host: string; pathPrefix?: string; publisher: string; kinds?: string[] }[], fetchFn: (url: string, init?: unknown) => Promise<{ status: number; ok: boolean; headers: { get(name: string): string | null }; text(): Promise<string> }>, opts?: { headers?: Record<string, string>; maxHops?: number }): Promise<{ html: string; finalUrl: string }>;
