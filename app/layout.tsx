import type { Metadata } from "next";
import { Newsreader, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import ViewTransitions from "@/components/ViewTransitions";
import Logo from "@/components/Logo";
import HeaderTopic from "@/components/HeaderTopic";
import BackToTop from "@/components/BackToTop";
import { Analytics } from "@vercel/analytics/next";

const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: { default: "sys101", template: "%s · sys101" },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icon-32.png", sizes: "32x32", type: "image/png" }] },
  description: "A map of system design concepts, annotated with engineering writing from the companies that run them.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${mono.variable}`}>
      <head>
        {/* Without JavaScript, reveals cannot open, so show their content. */}
        <noscript>
          <style>{`.reveal{grid-template-rows:1fr}.reveal-content{opacity:1;transform:none}.reveal-wrap>button{display:none}`}</style>
        </noscript>
      </head>
      <body>
        <ViewTransitions />
        <header className="site-header">
          <div className="site-header-inner">
            <Logo />
            <HeaderTopic />
          </div>
        </header>
        {children}
        <BackToTop />
        <Analytics />
      </body>
    </html>
  );
}
