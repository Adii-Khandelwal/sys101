import type { Metadata, Viewport } from "next";
import { Newsreader, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import ViewTransitions from "@/components/ViewTransitions";
import Logo from "@/components/Logo";
import SiteNav from "@/components/SiteNav";
import HeaderTopic from "@/components/HeaderTopic";
import BackToTop from "@/components/BackToTop";
import ThemeToggle from "@/components/ThemeToggle";
import Splash from "@/components/Splash";
import NavPending from "@/components/NavPending";
import OfflineSupport from "@/components/OfflineSupport";
import FindOnPage from "@/components/FindOnPage";
import { Analytics } from "@vercel/analytics/next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  axes: ["opsz"],
});

// Not preloaded, so it does not compete with the first paint (about 130 kB); it still loads on any page that shows italic text, and every page has some.
const serifItalic = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif-italic",
  style: "italic",
  axes: ["opsz"],
  preload: false,
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  description: SITE_DESCRIPTION,
};

/** Browser bar colour: the --paper token in each theme. */
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3ecdc" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1713" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Inline scripts set data-theme and data-posts-view on <html> before hydration, so React must not flag them.
  return (
    <html lang="en" className={`${serif.variable} ${serifItalic.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Set the theme before first paint so there is no flash. Reads the saved
            choice; with none, follows the OS. Mirrors ThemeToggle's storage key. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('sys101:theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`,
          }}
        />
        {/* Opening screen: the first homepage load of a browser session only (sessionStorage flag), never for reduced motion or automation. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(location.pathname!=='/'||navigator.webdriver||matchMedia('(prefers-reduced-motion: reduce)').matches||sessionStorage.getItem('sys101:splash'))return;sessionStorage.setItem('sys101:splash','1');document.documentElement.setAttribute('data-splash','1')}catch(e){}})()`,
          }}
        />
        {/* Without JavaScript, reveals cannot open, so show their content. */}
        <noscript>
          <style>{`.reveal{grid-template-rows:1fr}.reveal-content{opacity:1;transform:none}.reveal-wrap>button{display:none}`}</style>
        </noscript>
      </head>
      <body>
        <Splash />
        <NavPending />
        <ViewTransitions />
        <header className="site-header">
          <div className="site-header-inner">
            <Logo />
            <HeaderTopic />
            <SiteNav />
            <ThemeToggle />
          </div>
        </header>
        {children}
        <BackToTop />
        <Analytics />
        <OfflineSupport />
        <FindOnPage />
      </body>
    </html>
  );
}
