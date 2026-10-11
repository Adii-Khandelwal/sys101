import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

export const metadata: Metadata = { title: "Your data" };

export default function YourData() {
  return (
    <article className="dossier legal">
      <h1>Your data</h1>
      <p>Your reading progress is saved in this browser only, and tools to export, import and reset it will live here.</p>
      <SiteFooter />
    </article>
  );
}
