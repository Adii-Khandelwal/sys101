import type { Metadata } from "next";
import { PAGE_DATES, pageMeta } from "@/lib/site";
import Overprint from "@/components/Overprint";
import PageRail from "@/components/PageRail";
import PageUpdated from "@/components/PageUpdated";
import SiteFooter from "@/components/SiteFooter";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

export const metadata: Metadata = pageMeta({ path: "/privacy", title: "Privacy", description: "What sys101 stores and sends: reading progress stays in your browser, and anonymous page views go to Vercel Web Analytics without third-party cookies." });

const SECTIONS = [
  ["no-accounts", "No accounts"],
  ["your-progress-stays-in-your-browser", "Your progress stays in your browser"],
  ["offline-copy", "Offline copy"],
  ["server-logs", "Server logs"],
  ["page-view-counts", "Page view counts"],
  ["videos", "Videos"],
  ["links-to-other-sites", "Links to other sites"],
];

export default function Privacy() {
  return (
    <article className="dossier legal rail-page" data-pagefind-body>
      <PageRail sections={SECTIONS} />
      <Overprint as="h1" className="page-h1" data-pagefind-meta="title">Privacy</Overprint>

      <p className="short-version">Short version: there are no accounts, your progress stays in your browser, and only the host and the visit counter see standard technical data, until you play a video or follow a link out.</p>

      <Overprint as="h2" id="no-accounts">No accounts</Overprint>
      <p>
        There is nothing to sign up for or log in to. I don&apos;t ask for your name, email or account details. Your host and the site&apos;s analytics tool
        process some technical data, described below.
      </p>

      <Overprint as="h2" id="your-progress-stays-in-your-browser">Your progress stays in your browser</Overprint>
      <p>
        If you mark topics as read, that record is saved in your browser&apos;s localStorage on your
        own device. It is never sent anywhere. Clearing your browser data deletes it, and it won&apos;t
        follow you to another browser or device. The site also remembers your light or dark theme and your
        Map or Path choice, and which Great reads you have marked as read, and whether you have taken or skipped the guided tour so that its link is not
        shown again, in the same place. Your answers on a capstone page are saved there too.
      </p>

      <Overprint as="h2" id="offline-copy">Offline copy</Overprint>
      <p>
        After your first visit, a service worker saves a copy of the site&apos;s pages and files in your browser&apos;s cache, so you can
        keep reading with no connection. The copy is only the public site, never your progress, and it stays on your device. Clearing your
        browser&apos;s site data removes it.
      </p>

      <Overprint as="h2" id="server-logs">Server logs</Overprint>
      <p>
        The company hosting the site may keep standard server logs, such as IP address, browser type,
        and which page was requested. Hosts keep these for security and debugging. I don&apos;t use
        them to identify or track you.
      </p>

      <Overprint as="h2" id="page-view-counts">Page view counts</Overprint>
      <p>
        The site uses Vercel Web Analytics to count visits. Per its documentation, each page view can be stored with
        the page address, the referring site, a rough location, and your device type, operating system and
        browser. It uses no third-party cookies; a visitor is told apart by a hash made from the request, and
        that session is discarded after 24 hours. Vercel states that the data points are anonymous and cannot
        be used to follow you across sites. Your reading progress is never part of it. See{" "}
        <a href="https://vercel.com/docs/analytics/privacy-policy" target="_blank" rel="noopener noreferrer">
          Vercel&apos;s Web Analytics privacy documentation
        </a>
        .
      </p>

      <Overprint as="h2" id="videos">Videos</Overprint>
      <p>
        Some &ldquo;Start from zero&rdquo; pages list an optional video hosted on YouTube. Nothing loads
        from YouTube until you press &ldquo;Play here&rdquo;. Until then the page only shows the video&apos;s
        title and details, and no request reaches YouTube or Google. When you press play, the video loads
        from youtube-nocookie.com, YouTube&apos;s privacy-friendly player, and from that point YouTube
        receives data under its own privacy policy. You can always open the video on YouTube directly
        instead.
      </p>

      <Overprint as="h2" id="links-to-other-sites">Links to other sites</Overprint>
      <p>
        The posts linked here live on other companies&apos; sites. When you click through, their
        privacy policies apply, not this one.
      </p>

      <PageUpdated date={PAGE_DATES.privacy} />
      <SiteFooter />
    </article>
  );
}
