import type { Metadata } from "next";
import Link from "next/link";
import Overprint from "@/components/Overprint";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <article className="dossier legal">
      <Overprint as="h1" className="page-h1">Page not found</Overprint>
      <p>
        There is no page at this address. <Link href="/">Go to the map</Link> to pick a topic.
      </p>
      <SiteFooter />
    </article>
  );
}
