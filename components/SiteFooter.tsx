import Link from "next/link";

export default function SiteFooter({ floating = false }: { floating?: boolean }) {
  return (
    <footer className={floating ? "site-footer floating" : "site-footer"}>
      <Link href="/terms">Terms</Link>
      <span aria-hidden="true">·</span>
      <Link href="/privacy">Privacy</Link>
    </footer>
  );
}
