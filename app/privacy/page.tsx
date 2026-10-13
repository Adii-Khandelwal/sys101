import type { Metadata } from "next";
import { PAGE_DATES, pageMeta } from "@/lib/site";
import PageUpdated from "@/components/PageUpdated";
import SiteFooter from "@/components/SiteFooter";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

export const metadata: Metadata = pageMeta({ path: "/privacy", title: "Privacy", description: "What sys101 stores and sends: reading progress stays in your browser, and anonymous page views go to Vercel Web Analytics without third-party cookies." });

export default function Privacy() {
  return (
    <article className="dossier legal">

      <h1>Privacy</h1>

      <p>Short version: sys101 doesn&apos;t know who you are and doesn&apos;t try to find out.</p>

      <h2>No accounts</h2>
      <p>
        There is nothing to sign up for or log in to. We don&apos;t ask for your name, email or account details. Your host and our analytics tool
        process some technical data, described below.
      </p>

      <h2>Your progress stays in your browser</h2>
      <p>
        If you mark topics as read, that record is saved in your browser&apos;s localStorage on your
        own device. It is never sent to us. Clearing your browser data deletes it, and it won&apos;t
        follow you to another browser or device. The site also remembers your light or dark theme and your
        Map or Path choice, in the same place.
      </p>

      <h2>Server logs</h2>
      <p>
        The company hosting the site may keep standard server logs, such as IP address, browser type,
        and which page was requested. Hosts keep these for security and debugging. We don&apos;t use
        them to identify or track you.
      </p>

      <h2>Page view counts</h2>
      <p>
        We use Vercel Web Analytics to count visits. Per its documentation, each page view can be stored with
        the page address, the referring site, a rough location, and your device type, operating system and
        browser. It uses no third-party cookies; a visitor is told apart by a hash made from the request, and
        that session is discarded after 24 hours. Vercel states that the data points are anonymous and cannot
        be used to follow you across sites. Your reading progress is never part of it. See{" "}
        <a href="https://vercel.com/docs/analytics/privacy-policy" target="_blank" rel="noopener noreferrer">
          Vercel&apos;s Web Analytics privacy documentation
        </a>
        .
      </p>

      <h2>Videos</h2>
      <p>
        Some &ldquo;Start from zero&rdquo; pages list an optional video hosted on YouTube. Nothing loads
        from YouTube until you press &ldquo;Play here&rdquo;. Until then the page only shows the video&apos;s
        title and details, and no request reaches YouTube or Google. When you press play, the video loads
        from youtube-nocookie.com, YouTube&apos;s privacy-friendly player, and from that point YouTube
        receives data under its own privacy policy. You can always open the video on YouTube directly
        instead.
      </p>

      <h2>Links to other sites</h2>
      <p>
        The posts we link to live on other companies&apos; sites. When you click through, their
        privacy policies apply, not this one.
      </p>

      <PageUpdated date={PAGE_DATES.privacy} />
      <SiteFooter />
    </article>
  );
}
