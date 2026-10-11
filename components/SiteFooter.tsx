import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link href="/about">About</Link>
      <span aria-hidden="true">·</span>
      <Link href="/terms">Terms</Link>
      <span aria-hidden="true">·</span>
      <Link href="/privacy">Privacy</Link>
      <span aria-hidden="true">·</span>
      <Link href="/data">Your data</Link>
    </footer>
  );
}
