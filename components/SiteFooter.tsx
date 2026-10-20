import { Fragment } from "react";
import Link from "next/link";
import { NAV_ITEMS } from "@/lib/navItems";
import ReportMistake from "./ReportMistake";
import { LogoMark } from "./Logo";
import TourLink from "./TourLink";
import type { TourId } from "@/lib/tours";

const Dot = () => <span aria-hidden="true">·</span>;

/** Three short groups instead of one long row: what to read, the site's pages, and you. A page with a tour offers it here too. */
export default function SiteFooter({ tour }: { tour?: TourId }) {
  return (
    <footer className="site-footer" data-pagefind-ignore>
      <span className="footer-mark" aria-hidden="true">
        <LogoMark size={14} />
      </span>
      <p className="footer-group">
        {NAV_ITEMS.map((i, n) => (
          <Fragment key={i.href}>
            {n > 0 && <Dot />}
            <Link href={i.href}>{i.label}</Link>
          </Fragment>
        ))}
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
