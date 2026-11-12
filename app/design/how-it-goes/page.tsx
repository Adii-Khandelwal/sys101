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
          Every statement below is from the company&apos;s own careers page and carries the date of the page it comes from where the page shows one. Nothing here is a hiring bar, and rounds differ by role and by year. Back to the{" "}
          <Link href="/design">design questions</Link>.
        </p>
        {d.sections.map((s) => (
          <section className="cap-section" id={s.id} key={s.id}>
            <Overprint as="h2">{s.heading}</Overprint>
            <ul className="design-claims">
              {s.claims.map((c, i) => {
                const so = src(c.sourceId);
                return (
                  <li key={i}>
                    <p>{c.text}</p>
                    <p className="label design-badge">
                      <CompanyLogo name={so.company} size="sm" />
                      <a href={so.url} target="_blank" rel="noopener noreferrer">
                        {so.title}
                      </a>
                    </p>
                  </li>
                );
              })}
            </ul>
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
        <section className="cap-section" id="sources">
          <Overprint as="h2">Original sources</Overprint>
          <ul className="cap-sources">
            {d.sources.map((s) => (
              <li key={s.id}>
                <CompanyLogo name={s.company} size="sm" />
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.title}
                </a>
                <span className="label">
                  {s.company}{s.published === "no date shown" ? "" : `, ${s.published}`}. Terms: {s.terms}. Read {s.verifiedOn}.
                </span>
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
