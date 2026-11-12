import type { Metadata } from "next";
import Link from "next/link";
import CompanyLogo from "@/components/CompanyLogo";
import JsonLd from "@/components/JsonLd";
import Overprint from "@/components/Overprint";
import PageUpdated from "@/components/PageUpdated";
import SiteFooter from "@/components/SiteFooter";
import { getInterview, interviewDescription, interviewUpdated } from "@/lib/interview";
import { absoluteUrl, breadcrumbLd, pageMeta } from "@/lib/site";

// Prerendered at build time; the static route wins over /design/[slug], which only knows the files in content/design.
export const dynamic = "error";

const d = getInterview();

// Claims are stored sorted by source, so a group is a run of the same source.
function groupBySource(claims: { text: string; sourceId: string }[]) {
  const g: { sourceId: string; texts: string[] }[] = [];
  for (const c of claims) {
    const last = g[g.length - 1];
    if (last?.sourceId === c.sourceId) last.texts.push(c.text);
    else g.push({ sourceId: c.sourceId, texts: [c.text] });
  }
  return g;
}

export const metadata: Metadata = pageMeta({
  path: "/design/how-it-goes",
  title: d.title,
  description: interviewDescription(d),
});

export default function HowItGoes() {
  const src = (id: string) => d.sources.find((s) => s.id === id)!;
  const ld = { "@context": "https://schema.org", "@type": "WebPage", name: d.title, description: d.summary, url: absoluteUrl("/design/how-it-goes"), inLanguage: "en", dateModified: interviewUpdated(d) };
  return (
    <article className="dossier posts-page cap-page">
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Design questions", path: "/design" }, { name: d.title, path: "/design/how-it-goes" }])} />
      <JsonLd data={ld} />
      <div data-pagefind-body>
        <Overprint as="h1" className="page-h1" data-pagefind-meta="title">
          {d.title}
        </Overprint>
        <p className="posts-lead">{d.summary}</p>
        <p className="label">
          Nothing here is a hiring bar, and rounds differ by role and by year. Back to the <Link href="/design">design questions</Link>.
        </p>
        {d.sections.map((s) => (
          <section className="cap-section" id={s.id} key={s.id}>
            <Overprint as="h2">{s.heading}</Overprint>
            {groupBySource(s.claims).map((g) => {
              const so = src(g.sourceId);
              const meta = so.published !== "no date shown" ? so.published : /file metadata created (\d{4})/.exec(so.edition)?.[0].replace("created ", "");
              return (
                <div className="interview-group" key={g.sourceId}>
                  <p className="label design-badge interview-source">
                    <CompanyLogo name={so.company} size="sm" />
                    <span>{so.title}</span>
                    {meta && <span>{meta}</span>}
                    {so.published !== "no date shown" && !so.edition.startsWith("No file metadata") && <span>{so.edition}</span>}
                  </p>
                  <ul className="design-claims">
                    {g.texts.map((t, i) => (
                      <li key={i}>
                        <p>{t}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        ))}
        <section className="cap-section" id="no-guidance">
          <Overprint as="h2">Companies with no readable official guidance</Overprint>
          <p className="cap-outcome">These were looked for and nothing could be confirmed, so the page says nothing about them.</p>
          <ul className="design-claims">
            {d.noGuidance.map((n) => (
              <li key={n.company}>
                <p>
                  <strong>{n.company}.</strong> {n.note}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <PageUpdated date={interviewUpdated(d)} />
      <SiteFooter />
    </article>
  );
}
