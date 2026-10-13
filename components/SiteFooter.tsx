import Link from "next/link";
import ReportMistake from "./ReportMistake";
import TourLink from "./TourLink";
import type { TourId } from "@/lib/tours";

const Dot = () => <span aria-hidden="true">·</span>;

/** Three short groups instead of one long row: what to read, the site's pages, and you. A page with a tour offers it here too. */
export default function SiteFooter({ tour }: { tour?: TourId }) {
  return (
    <footer className="site-footer">
      <p className="footer-group">
        <Link href="/glossary">Glossary</Link>
        <Dot />
        <Link href="/posts">Posts</Link>
        {tour && (
          <>
            <Dot />
            <TourLink tour={tour} variant="footer" />
          </>
        )}
      </p>
      <p className="footer-group">
        <Link href="/about">About</Link>
        <Dot />
        <Link href="/terms">Terms</Link>
        <Dot />
        <Link href="/privacy">Privacy</Link>
      </p>
      <p className="footer-group">
        <Link href="/data" data-tour="your-data">
          Your data
        </Link>
        <Dot />
        <ReportMistake />
      </p>
    </footer>
  );
}
