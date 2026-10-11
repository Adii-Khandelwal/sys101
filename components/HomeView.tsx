"use client";

import { useEffect, useRef, useState } from "react";
import GraphView from "./GraphView";
import PathView, { type PathEntry } from "./PathView";
import TopicIndex from "./TopicIndex";

type GraphNode = { slug: string; title: string; posts: number; group: string };
type Edge = { from: string; to: string };
type IndexGroup = { name: string; entries: { slug: string; title: string; number: string }[] };

type Props = {
  nodes: GraphNode[];
  edges: Edge[];
  pathEntries: PathEntry[];
  indexGroups: IndexGroup[];
};

type View = "map" | "path";
const STORAGE_KEY = "sys101:homeView";

/**
 * The homepage body. The graph is the default on desktop; a toggle switches to
 * the Path view, a linear syllabus that is also the mobile default. The choice
 * is remembered per browser. The "All topics" index stays under the map but is
 * redundant under the Path view, so it is hidden there.
 */
export default function HomeView({ nodes, edges, pathEntries, indexGroups }: Props) {
  // Server and first client render must match, so start on "map" and decide the
  // real view after mount: an explicit saved choice wins at any width;
  // otherwise the Path view is the default on phones (under 768px) and the
  // graph is the default on wider screens (docs/ideas.md idea 6).
  const [view, setView] = useState<View>("map");
  const chosenRef = useRef(false); // the reader has picked a view explicitly

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // storage blocked
    }
    if (saved === "path" || saved === "map") {
      setView(saved);
      chosenRef.current = true;
      return;
    }
    // No explicit choice: follow the viewport, and keep following it on resize
    // until the reader picks one.
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => {
      if (!chosenRef.current) setView(mq.matches ? "path" : "map");
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // "Explore the map" from the intro switches to Map without marking an
  // explicit preference (so the mobile Path default still applies afterwards).
  useEffect(() => {
    const show = () => setView("map");
    window.addEventListener("sys101:show-map", show);
    return () => window.removeEventListener("sys101:show-map", show);
  }, []);

  const choose = (v: View) => {
    setView(v);
    chosenRef.current = true;
    try {
      window.localStorage.setItem(STORAGE_KEY, v);
    } catch {
      // storage blocked: the choice lasts for this page only
    }
  };

  return (
    <>
      <div className="home-toolbar" id="the-map">
        <span className="home-toolbar-label label">
          <span key={view} className="fade-swap">
            {view === "map" ? "The map" : "The path"}
          </span>
        </span>
        <div className="home-view-toggle label" role="group" aria-label="Choose how to view the topics">
          <span className="home-view-toggle-lead" aria-hidden="true">
            View
          </span>
          <button
            type="button"
            className="text-button home-view-active"
            key={view}
            aria-pressed="true"
            onClick={() => choose(view === "map" ? "path" : "map")}
          >
            {view === "map" ? "Map" : "Path"}
          </button>
          <span className="home-view-sep" aria-hidden="true">
            /
          </span>
          <button
            type="button"
            className="text-button home-view-other"
            aria-pressed="false"
            onClick={() => choose(view === "map" ? "path" : "map")}
          >
            {view === "map" ? "Path" : "Map"}
          </button>
        </div>
      </div>

      {view === "map" ? (
        <>
          <GraphView nodes={nodes} edges={edges} />
          <TopicIndex groups={indexGroups} />
        </>
      ) : (
        <PathView entries={pathEntries} />
      )}
    </>
  );
}
