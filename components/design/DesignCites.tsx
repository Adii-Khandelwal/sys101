import CompanyLogo from "@/components/CompanyLogo";
import type { Design, DesignSource } from "@/lib/design";

const year = (s: DesignSource) => (/^\d{4}/.test(s.published) ? `, ${s.published.slice(0, 4)}` : "");

/** Citations after a block: each source's name and year as a link. Unmarked text is the site's own reasoning, so nothing is shown without cites. */
export function Cites({ ids, sources }: { ids?: string[]; sources: Design["sources"] }) {
  const list = (ids ?? []).map((id) => sources.find((s) => s.id === id)).filter((s): s is DesignSource => !!s);
  if (!list.length) return null;
  return (
    <p className="label design-cites">
      <span>Sources</span>
      {list.map((s) => (
        <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer">
          {s.company}
          {year(s)}
        </a>
      ))}
    </p>
  );
}

/** A curiosity's badge: kind, company mark, name and year. */
export function SourceBadge({ src }: { src: DesignSource }) {
  return (
    <p className="label design-badge">
      <span>{src.kind === "paper" ? "Paper" : "Post"}</span>
      <CompanyLogo name={src.company} size="sm" />
      <a href={src.url} target="_blank" rel="noopener noreferrer">
        {src.company}
        {year(src)}
      </a>
    </p>
  );
}
