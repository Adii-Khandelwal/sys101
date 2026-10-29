import Link from "next/link";
import { NAV_ITEMS } from "@/lib/navItems";
import ReportMistake from "./ReportMistake";
import { LogoMark } from "./Logo";
import TourLink from "./TourLink";
import type { TourId } from "@/lib/tours";

/** Three plain text columns under a hairline: what to read, the site's pages, and you. A page with a tour offers it here too. */
export default function SiteFooter({ tour }: { tour?: TourId }) {
  return (
    <footer className="site-footer" data-pagefind-ignore>
      <span className="footer-mark" aria-hidden="true">
        <LogoMark size={14} />
      </span>
      <nav className="footer-col" aria-label="Read">
        <p className="footer-label">Read</p>
        <ul>
          {NAV_ITEMS.map((i) => (
            <li key={i.href}>
              <Link href={i.href}>{i.label}</Link>
            </li>
          ))}
          {tour && (
            <li>
              <TourLink tour={tour} variant="footer" />
            </li>
          )}
        </ul>
      </nav>
      <nav className="footer-col" aria-label="About the site">
        <p className="footer-label">The site</p>
        <ul>
          <li><Link href="/about">About</Link></li>
          <li><Link href="/terms">Terms</Link></li>
          <li><Link href="/privacy">Privacy</Link></li>
        </ul>
      </nav>
      <div className="footer-col">
        <p className="footer-label">You</p>
        <ul>
          <li>
            <Link href="/data" data-tour="your-data">
              Your data
            </Link>
          </li>
          <li><ReportMistake /></li>
        </ul>
      </div>
    </footer>
  );
}
