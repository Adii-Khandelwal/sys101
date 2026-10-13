import Link from "next/link";
import ReportMistake from "./ReportMistake";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link href="/about">About</Link>
      <span aria-hidden="true">·</span>
      <Link href="/glossary">Glossary</Link>
      <span aria-hidden="true">·</span>
      <Link href="/posts">Posts</Link>
      <span aria-hidden="true">·</span>
      <Link href="/terms">Terms</Link>
      <span aria-hidden="true">·</span>
      <Link href="/privacy">Privacy</Link>
      <span aria-hidden="true">·</span>
      <Link href="/data" data-tour="your-data">
        Your data
      </Link>
      <span aria-hidden="true">·</span>
      <ReportMistake />
    </footer>
  );
}
