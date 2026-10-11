"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAllProgress } from "@/lib/progress";
import { resumeTarget, type ResumeTarget } from "@/lib/nextUp";
import { navigateWithTransition } from "./ViewTransitions";

/** Concept-section ids to a readable name; a post id or unknown unit falls back to the topic only. */
const SECTION_NAMES: Record<string, string> = {
  model: "Mental model",
  how: "How it works",
  example: "Worked example",
  mistakes: "Common mistakes",
  check: "Check yourself",
  posts: "How companies use it",
  differ: "Where they differ",
};

/**
 * "Pick up where you left off": the topic the reader was partway through on a
 * previous visit, read from local progress only. Renders nothing for a new
 * visitor or when everything in progress is already finished.
 */
export default function HomeResume({ titles }: { titles: Record<string, string> }) {
  const router = useRouter();
  const { progress, updated, read } = useAllProgress();
  // Snapshot the resume target at first mount so scrolling on this visit (which
  // updates each topic's "last") does not move the suggestion mid-session.
  const [target, setTarget] = useState<ResumeTarget | null>(null);
  const pinned = useRef(false);

  useEffect(() => {
    if (pinned.current) return;
    // Wait until the store has read localStorage (topics populated) before
    // pinning, so we snapshot real progress, not the empty first render.
    if (Object.keys(progress.topics).length === 0) return;
    pinned.current = true;
    setTarget(resumeTarget(progress.topics, updated, read));
  }, [progress, updated, read]);

  if (!target || !titles[target.slug]) return null;
  const section = SECTION_NAMES[target.section];
  const href = `/topic/${target.slug}#${target.section}`;

  const open = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigateWithTransition(router, href);
  };

  return (
    <p className="home-resume label" data-pagefind-ignore>
      Pick up where you left off:{" "}
      <a href={href} onClick={open}>
        {titles[target.slug]}
        {section ? ` · ${section}` : ""}
      </a>
    </p>
  );
}
