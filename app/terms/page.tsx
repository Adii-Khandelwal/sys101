import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import { CONTACT_EMAIL } from "@/lib/site";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

export const metadata: Metadata = { title: "Terms" };

export default function Terms() {
  return (
    <article className="dossier legal">

      <div className="label">Last updated 11 October 2026</div>
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

      <h2>Blog content belongs to its authors</h2>
      <p>
        Every linked post belongs to the company or person who published it. sys101 only links to the
        original and adds its own write-up.
      </p>

      <h2>Write-ups can be wrong</h2>
      <p>
        Some write-ups are drafted with help from AI and may contain errors. When a write-up and the
        original post disagree, trust the post.
      </p>

      <h2>Things will change</h2>
      <p>Topics, links, and write-ups may be added, edited, or removed at any time.</p>

      <h2>Takedowns</h2>
      <p>
        If you wrote a post listed here and want it removed or its write-up corrected, email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and I&apos;ll deal with it promptly.
      </p>

      <SiteFooter />
    </article>
  );
}
