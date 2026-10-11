"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type Graph from "graphology";
import type Sigma from "sigma";
import type { NodeLabelDrawingFunction } from "sigma/rendering";
import { columns, edgeCurvatures, fitPositions, layers, rowCount, slotsByEdge, type Orientation } from "@/lib/graph";
import { useReadTopics } from "@/lib/progress";
import {
  STEP,
  clampPan,
  fitRatio,
  fitState,
  ratioLimits,
  wheelFactor,
  zoomBy,
  zoomLevel,
  type Camera,
} from "@/lib/camera";

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
const NARROW = "(max-width: 640px)"; // below this the map stacks top to bottom; matches the CSS
const PADDING = 48; // px between the stage edge and the outermost nodes
const FADE = 0.3; // non-neighbours keep 30% of their colour while a node is active
/**
 * Sigma's own wheel, drag and double-click handling stays off (it checks
 * these flags), but with them off camera.setState also ignores x/y/ratio.
 * So switch them on only for the moment we set the camera ourselves.
 */
function setCamera(camera: ReturnType<Sigma["getCamera"]>, state: Camera) {
  camera.enabledZooming = true;
  camera.enabledPanning = true;
  camera.setState(state);
  camera.enabledZooming = false;
  camera.enabledPanning = false;
}

const CLICK_SLOP = 5; // px a pointer may move before a press becomes a drag
const DOUBLE_CLICK_MS = 250; // wait this long before opening a topic, so a double-click can cancel it

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
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [active, setActive] = useState<string | null>(null);
  const [points, setPoints] = useState<Point[]>([]);

  // Reducers read this ref, so read-state changes only need a refresh.
  const readRef = useRef(read);
  useEffect(() => {
    readRef.current = read;
    rendererRef.current?.refresh({ skipIndexation: true });
  }, [read]);

  const cols = useMemo(() => columns(nodes, edges), [nodes, edges]);
  const layered = useMemo(() => layers(nodes, edges), [nodes, edges]);
  const bySlug = useMemo(() => new Map(nodes.map((n) => [n.slug, n])), [nodes]);

  // Orientation follows the same breakpoint as the stage height in CSS.
  useEffect(() => {
    const query = window.matchMedia(NARROW);
    const update = () => setOrientation(query.matches ? "vertical" : "horizontal");
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Track the stage size so the layout can fill it.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    // A pixel-ratio change (browser zoom, another display) keeps the CSS size
    // but still needs the canvases resized.
    let dpr: MediaQueryList;
    const watchDpr = () => {
      dpr?.removeEventListener("change", onDpr);
      dpr = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      dpr.addEventListener("change", onDpr);
    };
    const onDpr = () => {
      update();
      watchDpr();
    };
    watchDpr();
    return () => {
      observer.disconnect();
      dpr.removeEventListener("change", onDpr);
    };
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

  // ── Camera ────────────────────────────────────────────────────────────
  const fitRef = useRef(1);
  const [zoomPct, setZoomPct] = useState(100);
  const animFrame = useRef(0);
  const navTimer = useRef(0);
  const draggedRef = useRef(false);
  const overNode = useRef(false);
  const dragging = useRef(false);

  const setCursor = useCallback(() => {
    const el = container.current;
    if (el) el.style.cursor = dragging.current ? "grabbing" : overNode.current ? "pointer" : "grab";
  }, []);

  const cancelAnimation = useCallback(() => {
    cancelAnimationFrame(animFrame.current);
    animFrame.current = 0;
  }, []);

  /** Set the camera, animating unless reduced motion is on. Any running animation is cancelled first. */
  const applyCamera = useCallback(
    (next: Camera, animate: boolean) => {
      const camera = rendererRef.current?.getCamera();
      if (!camera) return;
      cancelAnimation();
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!animate || still) {
        setCamera(camera, next);
        return;
      }
      const from = camera.getState();
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 200);
        if (t >= 1) {
          // Land exactly on the target, so Fit all always gives the identical state.
          setCamera(camera, next);
          animFrame.current = 0;
          return;
        }
        const e = t * (2 - t);
        setCamera(camera, {
          x: from.x + (next.x - from.x) * e,
          y: from.y + (next.y - from.y) * e,
          ratio: from.ratio * Math.pow(next.ratio / from.ratio, e),
          angle: 0,
        });
        animFrame.current = t < 1 ? requestAnimationFrame(step) : 0;
      };
      animFrame.current = requestAnimationFrame(step);
    },
    [cancelAnimation],
  );

  /** Framed-graph point under a viewport point, at the current camera. */
  const framed = useCallback((p: { x: number; y: number }) => rendererRef.current!.viewportToFramedGraph(p), []);

  /** Zoom by a factor around a viewport point (the pointer). */
  const zoomAt = useCallback(
    (factor: number, viewportPoint: { x: number; y: number }, animate: boolean) => {
      const r = rendererRef.current;
      if (!r) return;
      applyCamera(zoomBy(r.getCamera().getState(), factor, framed(viewportPoint), fitRef.current), animate);
    },
    [applyCamera, framed],
  );

  /** Move the view by a screen distance, keeping part of the graph on screen. */
  const panBy = useCallback(
    (dx: number, dy: number) => {
      const r = rendererRef.current;
      const el = container.current;
      if (!r || !el) return;
      const cam = r.getCamera().getState();
      const a = framed({ x: 0, y: 0 });
      const b = framed({ x: dx, y: dy });
      const unit = framed({ x: 1, y: 0 });
      const unitsPerPx = Math.hypot(unit.x - a.x, unit.y - a.y) / cam.ratio;
      const pts = r.getGraph().mapNodes((_n, attr) => framed(r.graphToViewport({ x: attr.x, y: attr.y })));
      const box = {
        minX: Math.min(...pts.map((p) => p.x)),
        maxX: Math.max(...pts.map((p) => p.x)),
        minY: Math.min(...pts.map((p) => p.y)),
        maxY: Math.max(...pts.map((p) => p.y)),
      };
      const moved = { ...cam, x: cam.x - (b.x - a.x), y: cam.y - (b.y - a.y) };
      applyCamera(clampPan(moved, box, { width: el.clientWidth, height: el.clientHeight }, unitsPerPx), false);
    },
    [applyCamera, framed],
  );

  /** Fit all: the fitted camera, which also clears the hovered or focused topic. */
  const fitAll = useCallback(() => {
    activate(null);
    if (stage.current?.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
    applyCamera(fitState(fitRef.current), true);
  }, [activate, applyCamera]);

  const zoomCenter = useCallback(
    (factor: number) => {
      const r = rendererRef.current;
      if (!r) return;
      const cam = r.getCamera().getState();
      applyCamera(zoomBy(cam, factor, { x: cam.x, y: cam.y }, fitRef.current), true);
    },
    [applyCamera],
  );

  // Pointer, wheel and key input. Plain wheel scrolls the page.
  useEffect(() => {
    const el = container.current;
    const host = stage.current;
    if (!ready || !el || !host) return;
    setCursor();
    const pointers = new Map<number, { x: number; y: number }>();
    let start = { x: 0, y: 0 };
    const local = (e: { clientX: number; clientY: number }) => {
      const rect = el.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const pinch = () => {
      const [a, b] = [...pointers.values()];
      return { dist: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      cancelAnimation();
      const p = local(e);
      pointers.set(e.pointerId, p);
      if (pointers.size === 1) {
        start = p;
        draggedRef.current = false;
      }
    };
    const onMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const p = local(e);
      if (pointers.size >= 2) {
        const before = pinch();
        pointers.set(e.pointerId, p);
        const after = pinch();
        draggedRef.current = true;
        if (before.dist > 0 && after.dist > 0) zoomAt(after.dist / before.dist, after.mid, false);
        panBy(before.mid.x - after.mid.x, before.mid.y - after.mid.y);
        return;
      }
      pointers.set(e.pointerId, p);
      if (!dragging.current && Math.hypot(p.x - start.x, p.y - start.y) < CLICK_SLOP) return;
      if (!dragging.current) {
        dragging.current = true;
        draggedRef.current = true;
        // Capture only once it is a drag: capturing on press would send the
        // click to this wrapper instead of Sigma's canvas, so nodes stop opening.
        el.setPointerCapture(e.pointerId);
        setCursor();
      }
      panBy(prev.x - p.x, prev.y - p.y);
    };
    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size === 0 && dragging.current) {
        dragging.current = false;
        setCursor();
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd + wheel, and trackpad pinch, zoom at the pointer.
        e.preventDefault();
        zoomAt(wheelFactor(e.deltaY), local(e), false);
      } else if (e.shiftKey) {
        e.preventDefault();
        panBy(e.deltaX || e.deltaY, e.deltaX ? e.deltaY : 0);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") zoomCenter(STEP);
      else if (e.key === "-" || e.key === "_") zoomCenter(1 / STEP);
      else if (e.key === "0") fitAll();
      else return;
      e.preventDefault();
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    host.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
      host.removeEventListener("keydown", onKey);
      cancelAnimation();
      window.clearTimeout(navTimer.current);
    };
  }, [ready, setCursor, cancelAnimation, zoomAt, panBy, zoomCenter, fitAll]);

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
        // forceLabel: Sigma otherwise hides labels it guesses would collide;
        // the layout already keeps them apart, and every topic needs its name.
        graph.addNode(n.slug, { x: 0, y: 0, label: n.title, size: NODE_RADIUS, type: "bordered", forceLabel: true });
      }
      for (const e of edges) {
        if (graph.hasNode(e.from) && graph.hasNode(e.to)) graph.addEdge(e.from, e.to, { size: 1 });
      }

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
        // Padding is built into the custom bbox below instead, so the bbox has
        // exactly the stage's aspect ratio and Sigma fits it edge to edge.
        stagePadding: 0,
        // Zoom and pan are handled below, so every input shares one set of limits.
        enableCameraZooming: false,
        enableCameraPanning: false,
        enableCameraRotation: false,
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

      // Open a topic on click, but not after a drag, and not if a second click follows.
      renderer.on("clickNode", ({ node }) => {
        if (draggedRef.current) return;
        window.clearTimeout(navTimer.current);
        navTimer.current = window.setTimeout(() => router.push(`/topic/${node}`), DOUBLE_CLICK_MS);
      });
      renderer.on("doubleClickNode", ({ event }) => {
        window.clearTimeout(navTimer.current);
        event.preventSigmaDefault();
      });
      renderer.on("doubleClickStage", ({ event }) => {
        event.preventSigmaDefault();
        const out = (event.original as MouseEvent).shiftKey;
        zoomAt(out ? 1 / 2 : 2, { x: event.x, y: event.y }, true);
      });
      renderer.on("enterNode", ({ node }) => {
        overNode.current = true;
        setCursor();
        activate(node);
      });
      renderer.on("leaveNode", () => {
        overNode.current = false;
        setCursor();
        activate(null);
      });
      renderer.getCamera().on("updated", (state) => setZoomPct(Math.round(zoomLevel(state, fitRef.current) * 100)));
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

  // Place nodes in stage pixels and set the camera bounds to exactly the
  // padded stage, so the map fills the width and uses the full height.
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!ready || !renderer || !size.width || !size.height) return;
    const graph = renderer.getGraph();
    const width = Math.max(1, size.width - PADDING * 2);
    const height = Math.max(1, size.height - PADDING * 2);

    // Room for labels to the right of the nodes that need it: the last column
    // when horizontal, every node when stacked.
    const ctx = document.createElement("canvas").getContext("2d")!;
    ctx.font = `500 ${LABEL_SIZE}px ${getComputedStyle(document.body).fontFamily}`;
    const labelled = orientation === "horizontal" ? (cols[cols.length - 1] ?? []) : cols.flat();
    const labelRoom = NODE_RADIUS + 8 + Math.max(0, ...labelled.map((n) => ctx.measureText(n.title).width));

    // Horizontal layout reserves slots for long edges; stacked layout lists topics only.
    const positions = fitPositions(layered, orientation, { width, height, labelRoom });
    cols.flat().forEach((n) => graph.mergeNodeAttributes(n.slug, positions.get(n.slug)!));

    const labels = new Map(
      cols.flat().map((n) => [n.slug, { start: NODE_RADIUS + 8, width: ctx.measureText(n.title).width }]),
    );
    const bends = edgeCurvatures(positions, edges, slotsByEdge(layered, positions), {
      minX: -PADDING + 8,
      maxX: width + PADDING - 8,
      minY: -PADDING + 8,
      maxY: height + PADDING - 8,
    }, orientation, labels);
    graph.forEachEdge((edge, _attr, source, target) => {
      graph.setEdgeAttribute(edge, "curvature", bends.get(`${source}->${target}`) ?? 0);
    });
    renderer.setCustomBBox({ x: [-PADDING, width + PADDING], y: [-PADDING, height + PADDING] });
    // Forced, so a change in device pixel ratio (browser zoom, moving to
    // another display) also resizes the WebGL layers, not just the labels.
    renderer.resize(true);

    // The one fit ratio: recomputed here on load, resize and node-set change.
    const fit = fitRatio(width + PADDING * 2, height + PADDING * 2, size.width, size.height);
    fitRef.current = fit;
    const { min, max } = ratioLimits(fit);
    renderer.setSetting("minCameraRatio", min);
    renderer.setSetting("maxCameraRatio", max);
    cancelAnimation();
    setCamera(renderer.getCamera(), fitState(fit));
    renderer.refresh();
  }, [ready, cols, layered, edges, orientation, size]);

  const activePoint = active ? points.find((p) => p.slug === active) : undefined;
  const activeNode = active ? bySlug.get(active) : undefined;

  return (
    <>
      <div className="graph-toolbar">
        <p className="graph-legend label">
          <span className="legend-dot" aria-hidden="true" /> Unread
          <span className="legend-dot is-read" aria-hidden="true" /> Read
        </p>
        <div className="graph-controls label">
          <button type="button" className="text-button" onClick={() => zoomCenter(STEP)} disabled={!ready}>
            Zoom in
          </button>
          <button type="button" className="text-button" onClick={() => zoomCenter(1 / STEP)} disabled={!ready}>
            Zoom out
          </button>
          <button type="button" className="text-button" onClick={fitAll} disabled={!ready}>
            Fit all
          </button>
          <span className="zoom-readout" aria-live="polite">
            {zoomPct}%
          </span>
        </div>
      </div>

      <div
        ref={stage}
        className="graph-stage"
        role="group"
        aria-label="Topic map"
        // Stage height comes from the layout; CSS picks one per breakpoint (no shift on load).
        style={{ "--rows": rowCount(layered, "horizontal"), "--layers": rowCount(layered, "vertical") } as React.CSSProperties}
      >
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
