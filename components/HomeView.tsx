"use client";

import { useEffect, useRef, useState } from "react";
import GraphView from "./GraphView";
import PathView, { type PathEntry } from "./PathView";
import TopicIndex from "./TopicIndex";

type GraphNode = { slug: string; title: string; posts: number; group: string };
type Edge = { from: string; to: string };
type IndexGroup = {
  name: string;
  entries: { slug: string; title: string; number: string; minutes: number }[];
};

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
 * the Path view, a linear syllabus that is the only view on phones. The choice
 * is remembered per browser. The "All topics" index stays under the map but is
 * redundant under the Path view, so it is hidden there.
 */
export default function HomeView({
  nodes,
  edges,
  pathEntries,
  indexGroups,
}: Props) {
  // Server and first client render must match, so start on "map" and decide the
  // real view after mount. Phones (under 768px) always get the Path view with
  // no toggle; on wider screens a saved choice wins, else the map.
  const [view, setView] = useState<View>("map");
  const [mobile, setMobile] = useState(false);
  const mobileRef = useRef(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // storage blocked
    }
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => {
      mobileRef.current = mq.matches;
      setMobile(mq.matches);
      setView(mq.matches ? "path" : saved === "path" ? "path" : "map");
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // "Explore the map" from the intro switches to Map (desktop only).
  useEffect(() => {
    const show = () => {
      if (!mobileRef.current) setView("map");
    };
    window.addEventListener("sys101:show-map", show);
    return () => window.removeEventListener("sys101:show-map", show);
  }, []);

  const choose = (v: View) => {
    setView(v);
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
        {!mobile && (
          <div
            className="home-view-toggle label"
            role="group"
            aria-label="Choose how to view the topics"
          >
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
        )}
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
