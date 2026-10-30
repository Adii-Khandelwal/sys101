import type { Metadata } from "next";
import { AI_ASSISTANCE, CONTACT_EMAIL, PAGE_DATES, pageMeta } from "@/lib/site";
import Overprint from "@/components/Overprint";
import PageRail from "@/components/PageRail";
import PageUpdated from "@/components/PageUpdated";
import SiteFooter from "@/components/SiteFooter";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

export const metadata: Metadata = pageMeta({ path: "/terms", title: "Terms", description: "Terms of use for sys101: the site is provided as is, linked content belongs to its authors, write-ups can be wrong, and how to ask for a takedown." });

const SECTIONS = [
  ["provided-as-is", "Provided as is"],
  ["linked-content-belongs-to-its-authors", "Linked content belongs to its authors"],
  ["write-ups-can-be-wrong", "Write-ups can be wrong"],
  ["things-will-change", "Things will change"],
  ["takedowns", "Takedowns"],
];

export default function Terms() {
  return (
    <article className="dossier legal rail-page" data-pagefind-body>
      <PageRail sections={SECTIONS} />
      <Overprint as="h1" className="page-h1" data-pagefind-meta="title">Terms</Overprint>

      <p className="short-version">Short version: free to use, provided as is, and every linked post belongs to its authors.</p>

      <p>
        sys101 is a personal, non-commercial project: a map of system design topics with links to
        engineering posts about them. It is free to use.
      </p>

      <Overprint as="h2" id="provided-as-is">Provided as is</Overprint>
      <p>
        There is no warranty of any kind. The site may be wrong, out of date, or offline, and it takes
        no responsibility for decisions made based on it.
      </p>

      <Overprint as="h2" id="linked-content-belongs-to-its-authors">Linked content belongs to its authors</Overprint>
      <p>
        Every linked post, document and video belongs to the company, organization or person who
        published it. sys101 only links to the original and adds its own write-up.
      </p>

      <Overprint as="h2" id="write-ups-can-be-wrong">Write-ups can be wrong</Overprint>
      <p>{AI_ASSISTANCE}</p>

      <Overprint as="h2" id="things-will-change">Things will change</Overprint>
      <p>Topics, links, and write-ups may be added, edited, or removed at any time.</p>

      <Overprint as="h2" id="takedowns">Takedowns</Overprint>
      <p>
        If you wrote a post listed here and want it removed or its write-up corrected, email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and the request will be handled promptly.
      </p>

      <PageUpdated date={PAGE_DATES.terms} />
      <SiteFooter />
    </article>
  );
}
