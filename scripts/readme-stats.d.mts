export function stats(): Record<"topics" | "sources" | "organizations" | "kinds" | "reads" | "themes", string>;
export function apply(text: string, s?: ReturnType<typeof stats>): string;
