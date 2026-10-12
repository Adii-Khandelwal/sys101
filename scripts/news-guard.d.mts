export function pathAllowed(p: string): boolean;
export function touchedPaths(files: { filename: string; previous_filename?: string }[]): string[];
export function disallowedPaths(files: { filename: string; previous_filename?: string }[]): string[];
export function isNewsPr(files: { filename: string; previous_filename?: string }[], headRef: string): boolean;
export function isStrict(headRef: string): boolean;
export function allowlistChanged(base: Record<string, unknown>, head: Record<string, unknown>): boolean;
