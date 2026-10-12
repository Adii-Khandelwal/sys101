import type { Metadata } from "next";
import { CONTACT_EMAIL, PAGE_DATES, pageMeta } from "@/lib/site";
import PageUpdated from "@/components/PageUpdated";
import SiteFooter from "@/components/SiteFooter";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

export const metadata: Metadata = pageMeta({ path: "/terms", title: "Terms", description: "Terms of use for sys101: the site is provided as is, linked content belongs to its authors, write-ups can be wrong, and how to ask for a takedown." });

export default function Terms() {
  return (
    <article className="dossier legal">

      <h1>Terms</h1>

      <p>
        sys101 is a personal, non-commercial project: a map of system design topics with links to
        engineering posts about them. It is free to use.
      </p>

      <h2>Provided as is</h2>
      <p>
        There is no warranty of any kind. The site may be wrong, out of date, or offline, and I&apos;m
        not responsible for decisions you make based on it.
      </p>

      <h2>Linked content belongs to its authors</h2>
      <p>
        Every linked post, document and video belongs to the company, organization or person who
        published it. sys101 only links to the original and adds its own write-up.
      </p>

      <h2>Write-ups can be wrong</h2>
      <p>
        The write-ups are drafted with an AI assistant and may contain errors. When a write-up and the
        original disagree, trust the original.
      </p>

      <h2>Things will change</h2>
      <p>Topics, links, and write-ups may be added, edited, or removed at any time.</p>

      <h2>Takedowns</h2>
      <p>
        If you wrote a post listed here and want it removed or its write-up corrected, email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and I&apos;ll deal with it promptly.
      </p>

      <PageUpdated date={PAGE_DATES.terms} />
      <SiteFooter />
    </article>
  );
}
