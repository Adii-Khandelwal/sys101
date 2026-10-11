"use client";

import { useEffect, useState } from "react";
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
  // Server and first client render must match, so start on "map" and adopt the
  // saved choice after mount.
  const [view, setView] = useState<View>("map");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "path" || saved === "map") setView(saved);
    } catch {
      // storage blocked: default to map
    }
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
      <div className="home-toolbar">
        <span className="home-toolbar-label label">
          {view === "map" ? "The map" : "The path"}
        </span>
        <div className="home-view-toggle label" role="group" aria-label="Choose how to view the topics">
          <span className="home-view-toggle-lead" aria-hidden="true">
            View
          </span>
          <button type="button" className="text-button" aria-pressed={view === "map"} onClick={() => choose("map")}>
            Map
          </button>
          <span className="home-view-sep" aria-hidden="true">
            /
          </span>
          <button type="button" className="text-button" aria-pressed={view === "path"} onClick={() => choose("path")}>
            Path
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
