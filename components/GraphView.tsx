"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type Graph from "graphology";
import type Sigma from "sigma";
import type { NodeLabelDrawingFunction } from "sigma/rendering";
import { columns, layeredPositions, type Orientation } from "@/lib/graph";
import { useReadTopics } from "@/lib/progress";

type GraphNode = { slug: string; title: string; posts: number };
type GraphEdge = { from: string; to: string };

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

const INK = "#1f1b16";
const INK_SOFT = "#5c5346";
const EDGE = "#8a7f6c";
const PAPER = "#f3ecdc";
const ACCENT = "#9a3b1f";
const ACCENT_DARK = "#7a2c15";

const NODE_RADIUS = 14;
const LABEL_SIZE = 18;
const NARROW = 640; // px: below this the map stacks top to bottom
const FADE = 0.3; // non-neighbours keep 30% of their colour while a node is active
const MAX_RATIO = 1; // the fitted view; zooming out further only crowds the labels

/** Blend `hex` toward the paper colour, keeping `amount` of the original. */
function fade(hex: string, amount = FADE) {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(PAPER.slice(1), 16);
  const ch = (v: number, s: number) => (v >> s) & 255;
  const mix = (s: number) => Math.round(ch(a, s) * amount + ch(b, s) * (1 - amount));
  return `#${((mix(16) << 16) | (mix(8) << 8) | mix(0)).toString(16).padStart(6, "0")}`;
}

// Labels sit to the right of the node on a paper-coloured halo, so an edge
// passing behind never runs through the text.
const drawLabel: NodeLabelDrawingFunction = (ctx, data, settings) => {
  if (!data.label) return;
  const x = data.x + data.size + 8;
  const y = data.y + settings.labelSize / 3;
  ctx.font = `${settings.labelWeight} ${settings.labelSize}px ${settings.labelFont}`;
  ctx.lineJoin = "round";
  ctx.lineWidth = 6;
  ctx.strokeStyle = PAPER;
  ctx.strokeText(data.label, x, y);
  ctx.fillStyle = (data as { labelColor?: string }).labelColor ?? INK;
  ctx.fillText(data.label, x, y);
};

type Point = { slug: string; x: number; y: number; r: number };

export default function GraphView({ nodes, edges }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Sigma | null>(null);
  const activeRef = useRef<string | null>(null);
  const router = useRouter();
  const read = useReadTopics();

  const [ready, setReady] = useState(false);
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const [active, setActive] = useState<string | null>(null);
  const [points, setPoints] = useState<Point[]>([]);

  // Reducers read this ref, so read-state changes only need a refresh.
  const readRef = useRef(read);
  useEffect(() => {
    readRef.current = read;
    rendererRef.current?.refresh({ skipIndexation: true });
  }, [read]);

  const cols = useMemo(() => columns(nodes, edges), [nodes, edges]);
  const bySlug = useMemo(() => new Map(nodes.map((n) => [n.slug, n])), [nodes]);

  // Pick the orientation from the stage width, and follow it on resize.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const update = () => setOrientation(el.clientWidth < NARROW ? "vertical" : "horizontal");
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Scroll zooms the map, but once it is fully zoomed out a downward scroll
  // goes to the page instead, so the map never traps page scrolling.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const camera = rendererRef.current?.getCamera();
      if (camera && e.deltaY > 0 && camera.ratio >= MAX_RATIO - 1e-3) e.stopPropagation();
    };
    el.addEventListener("wheel", onWheel, { capture: true });
    return () => el.removeEventListener("wheel", onWheel, { capture: true });
  }, []);

  // Screen positions of nodes, for the focusable links and the tooltip.
  const syncPoints = useCallback(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const graph = renderer.getGraph();
    const next = graph.mapNodes((slug, attr) => {
      const { x, y } = renderer.graphToViewport({ x: attr.x, y: attr.y });
      const size = renderer.getNodeDisplayData(slug)?.size ?? NODE_RADIUS;
      return { slug, x, y, r: renderer.scaleSize(size) };
    });
    setPoints((prev) =>
      prev.length === next.length && prev.every((p, i) => p.x === next[i].x && p.y === next[i].y && p.r === next[i].r)
        ? prev
        : next,
    );
  }, []);

  const activate = useCallback((slug: string | null) => {
    activeRef.current = slug;
    setActive(slug);
    rendererRef.current?.refresh({ skipIndexation: true });
  }, []);

  // Create the renderer once.
  useEffect(() => {
    let renderer: Sigma | undefined;
    let cancelled = false;

    (async () => {
      const [{ default: GraphCtor }, { default: SigmaCtor }, { createNodeBorderProgram }, { createEdgeCurveProgram }] =
        await Promise.all([
          import("graphology"),
          import("sigma"),
          import("@sigma/node-border"),
          import("@sigma/edge-curve"),
          document.fonts.ready,
        ]);
      if (cancelled || !container.current) return;

      const graph: Graph = new GraphCtor({ type: "directed" });
      for (const n of nodes) {
        graph.addNode(n.slug, { x: 0, y: 0, label: n.title, size: NODE_RADIUS, type: "bordered" });
      }
      for (const e of edges) {
        if (graph.hasNode(e.from) && graph.hasNode(e.to)) graph.addEdge(e.from, e.to, { size: 1 });
      }

      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      renderer = new SigmaCtor(graph, container.current, {
        defaultEdgeType: "curve",
        defaultEdgeColor: EDGE,
        edgeProgramClasses: {
          curve: createEdgeCurveProgram({
            defaultCurvature: 0.18,
            arrowHead: { extremity: "target", lengthToThicknessRatio: 7, widenessToThicknessRatio: 5 },
          }),
        },
        nodeProgramClasses: {
          bordered: createNodeBorderProgram({
            borders: [
              { size: { value: 1.5, mode: "pixels" }, color: { attribute: "borderColor" } },
              { size: { fill: true }, color: { attribute: "color" } },
            ],
            drawLabel,
            drawHover: drawLabel,
          }),
        },
        labelFont: getComputedStyle(document.body).fontFamily,
        labelSize: LABEL_SIZE,
        labelWeight: "500",
        labelRenderedSizeThreshold: 0,
        defaultDrawNodeLabel: drawLabel,
        defaultDrawNodeHover: drawLabel,
        stagePadding: 48,
        minCameraRatio: 0.4,
        maxCameraRatio: MAX_RATIO,
        zoomDuration: still ? 0 : 150,
        inertiaDuration: still ? 0 : 200,
        doubleClickZoomingDuration: still ? 0 : 200,
        // Colours depend on read state and on which node is active.
        nodeReducer: (slug, data) => {
          const isRead = readRef.current.includes(slug);
          const current = activeRef.current;
          const isActive = slug === current;
          const near =
            !current || isActive || graph.areNeighbors(slug, current);
          const fill = isRead ? ACCENT : PAPER;
          const border = isRead ? (isActive ? ACCENT_DARK : ACCENT) : isActive ? INK : INK_SOFT;
          return {
            ...data,
            color: near ? fill : fade(fill),
            borderColor: near ? border : fade(border),
            labelColor: near ? INK : fade(INK),
            zIndex: near ? 1 : 0,
          };
        },
        edgeReducer: (edge, data) => {
          const current = activeRef.current;
          if (!current) return data;
          const touches = graph.source(edge) === current || graph.target(edge) === current;
          return { ...data, color: touches ? INK_SOFT : fade(EDGE) };
        },
      });

      renderer.on("clickNode", ({ node }) => router.push(`/topic/${node}`));
      renderer.on("enterNode", ({ node }) => {
        if (container.current) container.current.style.cursor = "pointer";
        activate(node);
      });
      renderer.on("leaveNode", () => {
        if (container.current) container.current.style.cursor = "";
        activate(null);
      });
      renderer.on("afterRender", syncPoints);

      rendererRef.current = renderer;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      renderer?.kill();
      rendererRef.current = null;
      setReady(false);
    };
  }, [nodes, edges, router, activate, syncPoints]);

  // Place nodes for the current orientation and frame them with room for labels.
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!ready || !renderer) return;
    const graph = renderer.getGraph();
    const positions = layeredPositions(cols, orientation);
    positions.forEach((p, slug) => graph.mergeNodeAttributes(slug, p));

    const xs = [...positions.values()].map((p) => p.x);
    const ys = [...positions.values()].map((p) => p.y);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    // Labels extend to the right of each node, so leave extra room on that side.
    renderer.setCustomBBox(
      orientation === "horizontal"
        ? { x: [minX - 0.1, maxX + 0.75], y: [minY - 0.4, maxY + 0.4] }
        : { x: [minX - 0.3, maxX + 1.8], y: [minY - 0.2, maxY + 0.2] },
    );
    renderer.getCamera().setState({ x: 0.5, y: 0.5, ratio: 1, angle: 0 });
    renderer.refresh();
  }, [ready, cols, orientation]);

  const resetView = () => {
    const camera = rendererRef.current?.getCamera();
    if (!camera) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) camera.setState({ x: 0.5, y: 0.5, ratio: 1, angle: 0 });
    else camera.animatedReset({ duration: 200 });
  };

  const activePoint = active ? points.find((p) => p.slug === active) : undefined;
  const activeNode = active ? bySlug.get(active) : undefined;

  return (
    <>
      <div className="graph-toolbar">
        <p className="graph-legend label">
          <span className="legend-dot" aria-hidden="true" /> Unread
          <span className="legend-dot is-read" aria-hidden="true" /> Read
        </p>
        <button type="button" className="text-button label" onClick={resetView} disabled={!ready}>
          Reset view
        </button>
      </div>

      <div ref={stage} className="graph-stage" role="group" aria-label="Topic map">
        {!ready && <GraphSkeleton />}
        <div ref={container} className="graph-canvas" aria-hidden="true" />

        {/* Invisible links over each node: keyboard focus and screen readers. */}
        {points.map((p) => {
          const n = bySlug.get(p.slug)!;
          const isRead = read.includes(p.slug);
          return (
            <Link
              key={p.slug}
              href={`/topic/${p.slug}`}
              className="graph-node-link"
              style={{ left: p.x, top: p.y, width: p.r * 2 + 6, height: p.r * 2 + 6 }}
              aria-label={`${n.title}, ${n.posts} ${n.posts === 1 ? "post" : "posts"}, ${isRead ? "read" : "unread"}`}
              onFocus={() => activate(p.slug)}
              onBlur={() => activate(null)}
            />
          );
        })}

        {activePoint && activeNode && (
          <div className="graph-tooltip" style={{ left: activePoint.x, top: activePoint.y - activePoint.r - 10 }}>
            <strong>{activeNode.title}</strong>
            <span>
              {activeNode.posts} {activeNode.posts === 1 ? "post" : "posts"}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

/** Same footprint as the loaded map: a row of nodes with labels, stacked on narrow screens. */
function GraphSkeleton() {
  return (
    <div className="graph-skeleton" aria-hidden="true">
      {[72, 120, 84, 140].map((w, i) => (
        <div key={i} className="graph-skeleton-step">
          {i > 0 && <span className="skeleton-edge" />}
          <span className="skeleton-node">
            <span className="skeleton-dot" />
            <span className="skeleton-bar" style={{ width: w }} />
          </span>
        </div>
      ))}
    </div>
  );
}
