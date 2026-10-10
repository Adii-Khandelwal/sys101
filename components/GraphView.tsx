"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type Graph from "graphology";
import type Sigma from "sigma";
import type { NodeHoverDrawingFunction, NodeLabelDrawingFunction } from "sigma/rendering";
import { useReadTopics } from "@/lib/progress";

type GraphNode = { slug: string; title: string; posts: number };
type GraphEdge = { from: string; to: string };

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

const INK = "#1f1b16";
const INK_SOFT = "#8a7f6c";
const PAPER = "#f3ecdc";
const ACCENT = "#9a3b1f";

/**
 * Starting positions for ForceAtlas2: a node's column is the length of the
 * longest prerequisite chain leading to it. Seeding from this (instead of
 * random positions) makes the settled layout the same on every load and keeps
 * foundations roughly to the left of what builds on them.
 */
function seedPositions(nodes: GraphNode[], edges: GraphEdge[]) {
  const prereqs = new Map(nodes.map((n) => [n.slug, [] as string[]]));
  for (const e of edges) prereqs.get(e.to)?.push(e.from);

  const depth = new Map<string, number>();
  const visit = (slug: string, seen: Set<string>): number => {
    if (depth.has(slug)) return depth.get(slug)!;
    if (seen.has(slug)) return 0; // cycle guard
    seen.add(slug);
    const parents = (prereqs.get(slug) ?? []).filter((p) => prereqs.has(p));
    const d = parents.length ? 1 + Math.max(...parents.map((p) => visit(p, seen))) : 0;
    depth.set(slug, d);
    return d;
  };
  nodes.forEach((n) => visit(n.slug, new Set()));

  const columns = new Map<number, string[]>();
  for (const n of nodes) {
    const d = depth.get(n.slug)!;
    columns.set(d, [...(columns.get(d) ?? []), n.slug]);
  }

  const positions = new Map<string, { x: number; y: number }>();
  for (const [d, slugs] of columns) {
    slugs.forEach((slug, i) => {
      // Small alternating offset so a pure chain doesn't start on one line,
      // which ForceAtlas2 can't pull apart vertically.
      positions.set(slug, { x: d * 10, y: (i - (slugs.length - 1) / 2) * 10 + (d % 2 ? 3 : -3) });
    });
  }
  return positions;
}

/** Read topics are solid accent; unread ones are outlined in ink. */
function nodeColors(isRead: boolean) {
  return isRead ? { color: ACCENT, borderColor: ACCENT } : { color: PAPER, borderColor: INK };
}

// Labels sit centred below each node so edges rarely cross them.
const drawLabel: NodeLabelDrawingFunction = (ctx, data, settings) => {
  if (!data.label) return;
  ctx.font = `${settings.labelWeight} ${settings.labelSize}px ${settings.labelFont}`;
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.fillText(data.label, data.x, data.y + data.size + settings.labelSize + 4);
  ctx.textAlign = "left";
};

// Sigma's default hover draws a white box with a drop shadow; instead, redraw
// the label in accent ink on a flat paper ground.
const drawHover: NodeHoverDrawingFunction = (ctx, data, settings) => {
  if (!data.label) return;
  const size = settings.labelSize;
  ctx.font = `${settings.labelWeight} ${size}px ${settings.labelFont}`;
  const width = ctx.measureText(data.label).width;
  const baseline = data.y + data.size + size + 4;
  ctx.fillStyle = PAPER;
  ctx.fillRect(data.x - width / 2 - 4, baseline - size, width + 8, size + 8);
  ctx.fillStyle = ACCENT;
  ctx.textAlign = "center";
  ctx.fillText(data.label, data.x, baseline);
  ctx.textAlign = "left";
};

export default function GraphView({ nodes, edges }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const rendererRef = useRef<Sigma | null>(null);
  const read = useReadTopics();

  useEffect(() => {
    let renderer: Sigma | undefined;
    let cancelled = false;

    (async () => {
      const [{ default: GraphCtor }, { default: SigmaCtor }, { default: forceAtlas2 }, { createNodeBorderProgram }] =
        await Promise.all([
          import("graphology"),
          import("sigma"),
          import("graphology-layout-forceatlas2"),
          import("@sigma/node-border"),
          document.fonts.ready,
        ]);
      if (cancelled || !container.current) return;

      const graph: Graph = new GraphCtor({ type: "directed" });
      const seeds = seedPositions(nodes, edges);
      for (const n of nodes) {
        graph.addNode(n.slug, {
          ...seeds.get(n.slug)!,
          label: n.title,
          size: 10 + Math.min(n.posts, 6) * 1.5,
          type: "bordered",
          ...nodeColors(false),
        });
      }
      for (const e of edges) {
        if (graph.hasNode(e.from) && graph.hasNode(e.to)) {
          graph.addEdge(e.from, e.to, { color: INK_SOFT, size: 1.5 });
        }
      }

      // Run the layout to completion before the first paint, so the graph
      // appears already settled and never moves afterwards.
      forceAtlas2.assign(graph, {
        iterations: 400,
        settings: { ...forceAtlas2.inferSettings(graph), gravity: 1, scalingRatio: 20, adjustSizes: true },
      });

      renderer = new SigmaCtor(graph, container.current, {
        defaultEdgeType: "arrow",
        nodeProgramClasses: {
          bordered: createNodeBorderProgram({
            borders: [
              { size: { value: 2, mode: "pixels" }, color: { attribute: "borderColor" } },
              { size: { fill: true }, color: { attribute: "color" } },
            ],
            drawLabel,
            drawHover,
          }),
        },
        labelFont: getComputedStyle(document.body).fontFamily,
        labelSize: 20,
        labelWeight: "500",
        labelColor: { color: INK },
        labelRenderedSizeThreshold: 0,
        defaultDrawNodeLabel: drawLabel,
        defaultDrawNodeHover: drawHover,
        stagePadding: 80,
        enableCameraZooming: false,
        enableCameraPanning: false,
      });

      renderer.on("clickNode", ({ node }) => router.push(`/topic/${node}`));
      renderer.on("enterNode", () => {
        if (container.current) container.current.style.cursor = "pointer";
      });
      renderer.on("leaveNode", () => {
        if (container.current) container.current.style.cursor = "default";
      });

      rendererRef.current = renderer;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      renderer?.kill();
      rendererRef.current = null;
      setReady(false);
    };
  }, [nodes, edges, router]);

  useEffect(() => {
    const graph = rendererRef.current?.getGraph();
    if (!ready || !graph) return;
    graph.forEachNode((slug) => graph.mergeNodeAttributes(slug, nodeColors(read.includes(slug))));
  }, [ready, read]);

  // The canvas is mouse-only; the text index below the graph carries the same
  // links for keyboard and screen-reader users.
  return (
    <div className="graph" aria-hidden="true">
      {!ready && <GraphSkeleton />}
      <div ref={container} className="graph-canvas" />
    </div>
  );
}

/** Placeholder shown while Sigma, the layout and the fonts load: muted nodes, edges and label bars. */
function GraphSkeleton() {
  return (
    <div className="graph-skeleton">
      {[0, 1, 2].map((i) => (
        <div key={i} className="graph-skeleton-step">
          {i > 0 && <span className="skeleton-edge" />}
          <span className="skeleton-node">
            <span className="skeleton-dot" />
            <span className="skeleton-bar" style={{ width: 48 + i * 22 }} />
          </span>
        </div>
      ))}
    </div>
  );
}
