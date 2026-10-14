"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { trackFade } from "@/lib/headerFade";
import { usePathname } from "next/navigation";

/** Short pages whose bar shows only the page name, never a section name. */
const NO_SECTIONS = new Set(["/about", "/terms", "/privacy", "/data"]);

/** Section headings that can show in the bar: plain serif text, on screen (not mono labels, hidden headings or the chrome). */
const sectionHeadings = () =>
  [...document.querySelectorAll<HTMLElement>("h2")].filter(
    (h) => h.childElementCount === 0 && !h.classList.contains("label") && !h.closest("nav, header, footer, aside") && h.offsetWidth > 1 && h.offsetHeight > 1 && !!h.textContent?.trim(),
  );

/**
 * On every page but the homepage (whose wordmark letters fly in instead: Logo), the page's name next to the logo, faded in once
 * its heading scrolls under the sticky header. After it, behind a thin rule, the section heading that has most recently passed
 * under the header: the next section's heading replaces it as it arrives, and it comes back as you scroll up. Decorative for
 * screen readers: the page and section headings already say it.
 */
export default function HeaderTopic() {
  const pathname = usePathname();
  const [heading, setHeading] = useState<HTMLElement | null>(null);
  const [sections, setSections] = useState<HTMLElement[]>([]);
  const title = heading?.textContent ?? null;
  const titleRef = useRef<HTMLSpanElement>(null);
  const crumbs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    setHeading(null);
    setSections([]);
    if (pathname === "/") return;
    let timer = 0;
    const start = performance.now();
    // After a client-side navigation the new page may still be loading: wait for its heading.
    const attach = () => {
      const h1 = document.querySelector<HTMLElement>("h1");
      if (!h1) {
        if (performance.now() - start < 3000) timer = window.setTimeout(attach, 50);
        return;
      }
      setHeading(h1);
      setSections(NO_SECTIONS.has(pathname) ? [] : sectionHeadings());
    };
    attach();
    return () => {
      window.clearTimeout(timer);
    };
  }, [pathname]);

  // Before paint, so the bar never shows a name that the page has not scrolled past.
  useLayoutEffect(() => {
    if (!heading || !titleRef.current) return;
    const stops = [trackFade(heading, titleRef.current)];
    sections.forEach((h, i) => crumbs.current[i] && stops.push(trackFade(h, crumbs.current[i]!, sections[i + 1])));
    return () => stops.forEach((stop) => stop());
  }, [heading, sections]);

  if (!title) return null;
  return (
    <span className="header-topic" aria-hidden="true">
      <span ref={titleRef} className="header-title">
        {title}
      </span>
      <span className="header-sections">
        {sections.map((h, i) => (
          <span key={i} ref={(el) => void (crumbs.current[i] = el)} className="header-crumb">
            <span className="header-topic-rule" />
            <span className="header-section-text">{h.textContent}</span>
          </span>
        ))}
      </span>
    </span>
  );
}
