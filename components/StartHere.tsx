"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useReadTopics } from "@/lib/progress";
import { prefersReducedMotion } from "@/lib/motion";

type Props = { firstSlug: string; firstTitle: string };

/**
 * First-run guidance: a quiet primary link into the first topic and a
 * secondary link that reveals and scrolls to the map. Shown only to visitors
 * with no progress; once a topic is read, "Next up" carries the resume and
 * this disappears, so returning visitors never see a repeated onboarding
 * prompt. Renders nothing until mounted, so the server and first client paint
 * agree and there is no flash for people with progress.
 */
export default function StartHere({ firstSlug, firstTitle }: Props) {
  const read = useReadTopics();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || read.length > 0) return null;

  // Reveal the Map (if the reader is on Path), then scroll to it and focus the
  // first node, so "Explore the map" works from either view.
  const exploreMap = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("sys101:show-map"));
    // Wait a frame for the Map to mount if we just switched to it.
    requestAnimationFrame(() => {
      const stage = document.querySelector<HTMLElement>(".graph-stage");
      stage?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>(".graph-node-link")?.focus({ preventScroll: true });
      });
    });
  };

  return (
    <p className="start-here" data-pagefind-ignore>
      <Link className="start-primary" href={`/topic/${firstSlug}`}>
        Start with {firstTitle}
      </Link>
      <span className="start-sep" aria-hidden="true">
        ·
      </span>
      <a className="start-secondary" href="#the-map" onClick={exploreMap}>
        Explore the map
      </a>
    </p>
  );
}
