import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <article className="dossier legal">
      <h1>Page not found</h1>
      <p>
        There is no page at this address. <Link href="/">Go to the map</Link> to pick a topic.
      </p>
      <SiteFooter />
    </article>
  );
}
