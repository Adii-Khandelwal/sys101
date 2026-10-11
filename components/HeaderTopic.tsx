"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * On topic pages, the topic's name next to the logo once its heading has
 * scrolled under the sticky header. Decorative for screen readers: the page
 * heading already names the topic.
 */
export default function HeaderTopic() {
  const pathname = usePathname();
  const [title, setTitle] = useState<string | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setShown(false);
    setTitle(null);
    if (!pathname.startsWith("/topic/")) return;
    let io: IntersectionObserver | undefined;
    let timer = 0;
    const start = performance.now();
    // After a client-side navigation the new page may still be loading: wait for its heading.
    const attach = () => {
      const h1 = document.querySelector<HTMLElement>("article h1");
      if (!h1) {
        if (performance.now() - start < 3000) timer = window.setTimeout(attach, 50);
        return;
      }
      setTitle(h1.textContent);
      const header = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
      // Shown once the heading has passed under the header.
      io = new IntersectionObserver(([e]) => setShown(!e.isIntersecting && e.boundingClientRect.top < header), {
        rootMargin: `-${header}px 0px 0px 0px`,
      });
      io.observe(h1);
    };
    attach();
    return () => {
      window.clearTimeout(timer);
      io?.disconnect();
    };
  }, [pathname]);

  if (!title) return null;
  return (
    <span className={`header-topic${shown ? " is-shown" : ""}`} aria-hidden="true">
      {title}
    </span>
  );
}
