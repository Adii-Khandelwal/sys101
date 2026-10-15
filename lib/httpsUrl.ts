/** Why a link must not be rendered as an external address, or null when it is a plain https URL without credentials. */
export function httpsUrlProblem(u: unknown): string | null {
  let url: URL | null = null;
  try {
    url = new URL(String(u));
  } catch {}
  return url && url.protocol === "https:" && !url.username && !url.password ? null : `"${String(u)}" must be an https URL without credentials`;
}
