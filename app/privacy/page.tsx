import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = { title: "Privacy · sys101" };

export default function Privacy() {
  return (
    <article className="dossier legal">
      <nav className="label">
        <Link href="/">← sys101</Link>
      </nav>

      <div className="label">Last updated 11 October 2026</div>
      <h1>Privacy</h1>

      <p>Short version: sys101 doesn&apos;t know who you are and doesn&apos;t try to find out.</p>

      <h2>No accounts</h2>
      <p>
        There is nothing to sign up for or log in to. We don&apos;t collect your name, email, or any
        other personal data.
      </p>

      <h2>Your progress stays in your browser</h2>
      <p>
        If you mark topics as read, that record is saved in your browser&apos;s localStorage on your
        own device. It is never sent to us. Clearing your browser data deletes it, and it won&apos;t
        follow you to another browser or device.
      </p>

      <h2>Server logs</h2>
      <p>
        The company hosting the site may keep standard server logs, such as IP address, browser type,
        and which page was requested. Hosts keep these for security and debugging. We don&apos;t use
        them to identify or track you.
      </p>

      <h2>Links to other sites</h2>
      <p>
        The posts we link to live on other companies&apos; sites. When you click through, their
        privacy policies apply, not this one.
      </p>

      <SiteFooter />
    </article>
  );
}
