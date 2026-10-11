import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

export const metadata: Metadata = { title: "Your data · sys101" };

export default function YourData() {
  return (
    <article className="dossier legal">
      <nav className="label">
        <Link href="/">← sys101</Link>
      </nav>
      <h1>Your data</h1>
      <p>Your reading progress is saved in this browser only, and tools to export, import and reset it will live here.</p>
      <SiteFooter />
    </article>
  );
}
