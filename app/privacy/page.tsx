import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <article className="dossier legal">

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

      <h2>Page view counts</h2>
      <p>
        We use Vercel Web Analytics to count visits: which pages are viewed, the referring site, and
        rough device, browser and country. It sets no cookies and doesn&apos;t identify you or follow
        you across sites; visits are counted anonymously. Your reading progress is never part of it.
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
