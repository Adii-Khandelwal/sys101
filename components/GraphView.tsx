"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import IntentLink from "./IntentLink";
import { useRouter } from "next/navigation";
import type Graph from "graphology";
import type Sigma from "sigma";
import type { NodeLabelDrawingFunction } from "sigma/rendering";
import { LABEL_START, MIN_LABEL_SCALE, chooseLayers, columns, edgeCurvatures, fitPositions, layers, rowCount, slotsByEdge, transitiveReduction, type Orientation } from "@/lib/graph";
import { useInProgressTopics, useReadTopics } from "@/lib/progress";
import {
  LIGHT_COLORS,
  type ThemeColors,
  prerequisiteLines,
  readThemeColors,
  fadeTo,
  groupSet,
  highlightSet,
  mapIsInteractiveAt,
  nextHighlight,
  placeTooltip,
  groupLabelSpots,
  placeGroupLabel,
  type HighlightEvent,
} from "@/lib/graphUi";
import { createPortal } from "react-dom";
import { DURATION, easeInOut, prefersReducedMotion } from "@/lib/motion";
import { navigateWithTransition, pageReady } from "./ViewTransitions";
import { clickIntent, playNodeOpen, removeBubbles } from "@/lib/nodeOpen";
import { saveMapView, takeMapView, type MapView } from "@/lib/mapView";
import { DESKTOP, PHONE } from "@/lib/breakpoints";
import {
  STEP,
  clampPan,
  dragView,
  fitRatio,
  fitState,
  isFitted,
  moveView,
  clampRatio,
  ratioLimits,
  wheelFactor,
  zoomBy,
  type Camera,
} from "@/lib/camera";

type GraphNode = { slug: string; title: string; posts: number; group?: string; concept?: string };
type GraphEdge = { from: string; to: string };

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};


const NODE_RADIUS = 14;
const LABEL_SIZE = 18;
const EDGE_EMPHASIS = 2; // highlighted edges are drawn this many times their base width
const NARROW = PHONE; // below this the map stacks top to bottom; matches the CSS and the mobile Path default
const PADDING = 48; // px between the stage edge and the outermost nodes
const PADDING_TOP = 86; // node centres sit this far down, so the first row is 56px+ below the controls
const TOP_CLEAR = 24; // edges stay this far below the legend and controls line
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

/** The first sentence of a concept, trimmed, for a one-line tooltip description. */
function firstSentence(text: string) {
  const end = text.search(/\.\s/);
  const s = end === -1 ? text : text.slice(0, end + 1);
  return s.length > 140 ? s.slice(0, 137).trimEnd() + "…" : s;
}


// The live map palette, refreshed from the CSS theme vars on load and whenever
// the theme changes, so the Sigma canvas (which cannot read CSS) stays in step.
let liveColors: ThemeColors = LIGHT_COLORS;

// Labels sit to the right of the node on a paper-coloured halo, so an edge
// passing behind never runs through the text.
const drawLabel: NodeLabelDrawingFunction = (ctx, data, settings) => {
  if (!data.label) return;
  const x = data.x + data.size + 8;
  const y = data.y + settings.labelSize / 3;
  ctx.font = `${settings.labelWeight} ${settings.labelSize}px ${settings.labelFont}`;
  ctx.lineJoin = "round";
  ctx.lineWidth = 6;
  ctx.strokeStyle = liveColors.paper;
  ctx.strokeText(data.label, x, y);
  ctx.fillStyle = (data as { labelColor?: string }).labelColor ?? liveColors.ink;
  ctx.fillText(data.label, x, y);
};

type Point = { slug: string; x: number; y: number; r: number };

export default function GraphView({ nodes, edges }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const scrollWrap = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Sigma | null>(null);
  const highlightRef = useRef<Set<string>>(new Set());
  const edgesRef = useRef(edges);
  edgesRef.current = edges;
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const hiddenRef = useRef<{ from: string; to: string }[]>([]);
  const activeRef = useRef<string | null>(null);
  const activeGroupRef = useRef<string | null>(null);
  const router = useRouter();
  const read = useReadTopics();

  const [ready, setReady] = useState(false);
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  // Phones get a fixed, non-interactive map so a finger scrolls the page past
  // it and a tap opens the topic. Starts false (desktop-first) to match SSR,
  // then follows the NARROW media query. See the orientation effect below.
  const [isPhone, setIsPhone] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [active, setActive] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  // The stage's pixel width when the horizontal map is wider than the viewport
  // (so the wrapper scrolls); 0 means it fits, and the stage fills the viewport.
  const [contentWidth, setContentWidth] = useState(0);
  const [points, setPoints] = useState<Point[]>([]);

  // Reducers read this ref, so read-state changes only need a refresh.
  const readRef = useRef(read);
  useEffect(() => {
    readRef.current = read;
    rendererRef.current?.refresh({ skipIndexation: true });
  }, [read]);

  // Topics started but not finished, for the "in progress" node marker.
  const inProgress = useInProgressTopics();
  const inProgressRef = useRef(inProgress);
  useEffect(() => {
    inProgressRef.current = inProgress;
    rendererRef.current?.refresh({ skipIndexation: true });
  }, [inProgress]);

  // Keep the Sigma canvas palette in step with the page theme. The map reads
  // the CSS theme vars into module-level `liveColors`; refresh it (and the
  // default edge colour) whenever the <html data-theme> attribute changes.
  useEffect(() => {
    const sync = () => {
      liveColors = readThemeColors();
      const r = rendererRef.current;
      if (r) {
        r.setSetting("defaultEdgeColor", liveColors.edge);
        r.refresh({ skipIndexation: true });
      }
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    // The OS theme can change while no explicit choice is set.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      mq.removeEventListener("change", sync);
    };
  }, []);

  // Draw only the transitive reduction; the full edge set still drives
  // neighbours, ready state and the "Also builds on" hints.
  const drawn = useMemo(() => transitiveReduction(edges), [edges]);
  const hidden = useMemo(() => edges.filter((e) => !drawn.includes(e)), [edges, drawn]);
  const prereqs = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const e of edges) m.set(e.to, [...(m.get(e.to) ?? []), e.from]);
    return m;
  }, [edges]);
  const neighbours = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const e of edges) {
      m.set(e.from, (m.get(e.from) ?? new Set()).add(e.to));
      m.set(e.to, (m.get(e.to) ?? new Set()).add(e.from));
    }
    return m;
  }, [edges]);
  const cols = useMemo(() => columns(nodes, drawn), [nodes, drawn]);
  const layered = useMemo(() => layers(nodes, drawn), [nodes, drawn]);
  const prereqsRef = useRef(prereqs);
  prereqsRef.current = prereqs;
  const neighboursRef = useRef(neighbours);
  neighboursRef.current = neighbours;

  // Columns need room for their widest label; when the stage is too narrow,
  // stack the map instead of letting labels crowd the next node.
  const [fits, setFits] = useState(true);
  // Labels shrink a little (never below MIN_LABEL_SCALE) to keep the horizontal map on narrower stages.
  const [labelScale, setLabelScale] = useState(1);
  const effective: Orientation = orientation === "horizontal" && fits ? "horizontal" : "vertical";

  // "Show all links" draws the hidden edges permanently. Remembered for the session.
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    try {
      setShowAll(sessionStorage.getItem("sys101:showAllLinks") === "1");
    } catch {
      // storage blocked: default off
    }
  }, []);

  // Hidden edges as screen-space curves, kept in step with the camera.
  const hiddenBends = useRef(new Map<string, number>());
  const [edgeSamples, setEdgeSamples] = useState<{ key: string; points: { x: number; y: number }[] }>({ key: "", points: [] });
  const [extraPaths, setExtraPaths] = useState<{ from: string; to: string; d: string }[]>([]);
  const bySlug = useMemo(() => new Map(nodes.map((n) => [n.slug, n])), [nodes]);

  // Orientation follows the same breakpoint as the stage height in CSS.
  useEffect(() => {
    const query = window.matchMedia(NARROW);
    const update = () => {
      setOrientation(query.matches ? "vertical" : "horizontal");
      setIsPhone(query.matches);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Track the stage size so the layout can fill it.
  useEffect(() => {
    const el = stage.current;
    const wrap = scrollWrap.current;
    if (!el || !wrap) return;
    // Viewport width comes from the scroll wrapper (always the visible area);
    // height comes from the stage. The stage's own width is driven by the
    // content width, so measuring it for width would feed back on itself.
    const update = () => setSize({ width: wrap.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    observer.observe(wrap);
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
    const paths = hiddenRef.current.map((e) => {
      const a = graph.getNodeAttributes(e.from);
      const b = graph.getNodeAttributes(e.to);
      const c = hiddenBends.current.get(`${e.from}->${e.to}`) ?? 0;
      const ctrl = { x: (a.x + b.x) / 2 - (b.y - a.y) * c, y: (a.y + b.y) / 2 + (b.x - a.x) * c };
      const [A, C, B] = [a, ctrl, b].map((p) => renderer.graphToViewport({ x: p.x, y: p.y }));
      return { from: e.from, to: e.to, d: `M${A.x},${A.y} Q${C.x},${C.y} ${B.x},${B.y}` };
    });
    setExtraPaths((prev) => (prev.map((p) => p.d).join() === paths.map((p) => p.d).join() ? prev : paths));
    // Drawn edges as screen points, so group labels can sit where no edge passes.
    const samples: { x: number; y: number }[] = [];
    graph.forEachEdge((_edge, attr, source, target) => {
      const a = graph.getNodeAttributes(source);
      const b = graph.getNodeAttributes(target);
      const c = (attr.curvature as number) ?? 0;
      const ctrl = { x: (a.x + b.x) / 2 - (b.y - a.y) * c, y: (a.y + b.y) / 2 + (b.x - a.x) * c };
      const [A, C, B] = [a, ctrl, b].map((p) => renderer.graphToViewport({ x: p.x, y: p.y }));
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        samples.push({ x: (1 - t) ** 2 * A.x + 2 * t * (1 - t) * C.x + t ** 2 * B.x, y: (1 - t) ** 2 * A.y + 2 * t * (1 - t) * C.y + t ** 2 * B.y });
      }
    });
    const key = samples.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join();
    setEdgeSamples((prev) => (prev.key === key ? prev : { key, points: samples }));
  }, []);

  const activate = useCallback((slug: string | null) => {
    activeRef.current = slug;
    activeGroupRef.current = null;
    setActiveGroup(null);
    highlightRef.current = slug ? highlightSet(slug, edgesRef.current) : new Set();
    setActive(slug);
    rendererRef.current?.refresh({ skipIndexation: true });
  }, []);

  // Clicking a group label highlights just that group's nodes and fades the
  // rest. A second click on the same group, or any node/escape/scroll, clears it.
  const activateGroup = useCallback((name: string | null) => {
    const next = name === activeGroupRef.current ? null : name;
    activeRef.current = null;
    setActive(null);
    activeGroupRef.current = next;
    setActiveGroup(next);
    highlightRef.current = next ? groupSet(next, nodesRef.current) : new Set();
    rendererRef.current?.refresh({ skipIndexation: true });
  }, []);

  // ── Camera ────────────────────────────────────────────────────────────
  const fitRef = useRef(1);
  /** The view is the fitted one, so the fit button has nothing to do. */
  const [fitted, setFitted] = useState(true);
  // Small maps fit on screen: no zoom, pan or controls until there are enough
  // topics to need them. Phones always get the fixed map, whatever the count,
  // so a finger scrolls the page past it and a tap opens the topic.
  const interactive = mapIsInteractiveAt(nodes.length, isPhone);
  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;
  const animFrame = useRef(0);
  const navTimer = useRef(0);
  /** The bubble of a node being opened. Cleared on a second click, a double click, and when the map goes away. */
  const pendingOpen = useRef<{ cancel: () => void } | null>(null);
  /** The view saved when a node was opened, if the map is being returned to by Back or Forward (undefined: not read yet). */
  const viewToRestore = useRef<MapView | null | undefined>(undefined);
  const scrollToRestore = useRef<number | null>(null);
  const draggedRef = useRef(false);
  const overNode = useRef(false);
  const dragging = useRef(false);

  const setCursor = useCallback(() => {
    const el = container.current;
    if (el) el.style.cursor = dragging.current
      ? "grabbing"
      : overNode.current
        ? "pointer"
        : interactiveRef.current
          ? "grab"
          : "default";
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
      if (!animate || prefersReducedMotion()) {
        setCamera(camera, next);
        return;
      }
      const from = camera.getState();
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION.slow);
        if (t >= 1) {
          // Land exactly on the target, so Fit all always gives the identical state.
          setCamera(camera, next);
          animFrame.current = 0;
          return;
        }
        const e = easeInOut(t);
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
      const moved = moveView(cam, { x: b.x - a.x, y: b.y - a.y });
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
    if (!interactive) return; // fixed map: page scroll and clicks only
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
        const v = dragView(before.mid, after.mid);
        panBy(v.x, v.y);
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
      const v = dragView(prev, p);
      panBy(v.x, v.y);
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
  }, [ready, interactive, setCursor, cancelAnimation, zoomAt, panBy, zoomCenter, fitAll]);

  // Create the renderer once.
  useEffect(() => {
    // Phones only get the Path view (HomeView swaps GraphView out right after its first render), so they skip
    // the map libraries, about 190 KB. Going wider than 767px makes HomeView mount GraphView again.
    if (!window.matchMedia(DESKTOP).matches) return;
    let renderer: Sigma | undefined;
    let cancelled = false;
    let removeMiddle: (() => void) | undefined;

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
      for (const e of transitiveReduction(edges)) {
        if (graph.hasNode(e.from) && graph.hasNode(e.to)) graph.addEdge(e.from, e.to, { size: 1 });
      }

      renderer = new SigmaCtor(graph, container.current, {
        defaultEdgeType: "curve",
        defaultEdgeColor: liveColors.edge,
        edgeProgramClasses: {
          curve: createEdgeCurveProgram({
            defaultCurvature: 0.18,
            arrowHead: { extremity: "target", lengthToThicknessRatio: 7, widenessToThicknessRatio: 5 },
          }),
        },
        nodeProgramClasses: {
          bordered: createNodeBorderProgram({
            borders: [
              { size: { attribute: "borderSize", defaultValue: 1.5, mode: "pixels" }, color: { attribute: "borderColor" } },
              { size: { value: 0.55, mode: "relative" }, color: { attribute: "color" } },
              // Centre dot: shown only on ready nodes (same colour as the fill otherwise).
              { size: { fill: true }, color: { attribute: "dotColor" } },
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
          const c = liveColors; // the current theme's palette
          const isRead = readRef.current.includes(slug);
          const current = activeRef.current;
          // Something is highlighting: a hovered/focused node or a clicked group.
          const highlighting = current !== null || activeGroupRef.current !== null;
          const isActive = slug === current;
          // Opaque: the node, its whole prerequisite chain and its dependents,
          // or every node of the clicked group.
          const near = !highlighting || highlightRef.current.has(slug);
          // A node in the highlighted set, while something is highlighting: its
          // outline darkens and thickens so the lit nodes read as one set with
          // the darkened edges, not just "not faded".
          const lit = highlighting && near;
          // Ready: unread with every prerequisite read. A thicker outline and a centre dot, so it reads without colour.
          const ready = !isRead && (prereqsRef.current.get(slug) ?? []).every((p) => readRef.current.includes(p));
          // In progress: started but not finished. A rust outline and a rust centre dot on a hollow node,
          // so it sits between unread (soft outline) and read (solid fill): "yours, but not full yet".
          const inProg = !isRead && inProgressRef.current.includes(slug);
          const fill = isRead ? c.accent : c.paper;
          // Lit nodes take the strong ink (read: darker rust); otherwise the usual soft outline.
          // In progress uses the rust accent on the outline even when not read.
          const border = isRead
            ? isActive || lit
              ? c.accentDark
              : c.accent
            : inProg
              ? isActive || lit
                ? c.accentDark
                : c.accent
              : isActive || lit
                ? c.ink
                : c.inkSoft;
          // Ready and in-progress both carry a centre dot (shape signal); size matches "ready".
          const dotted = ready || inProg;
          const baseSize = dotted ? 3 : 1.5;
          // The lit set thickens by 1; the single hovered/focused node thickens
          // a little more, so you still see exactly which node you are on.
          const borderSize = isActive ? baseSize + 1.5 : lit ? baseSize + 1 : baseSize;
          // Centre dot colour: in-progress gets the rust border colour; ready keeps the soft outline colour.
          const dot = dotted ? (near ? border : fadeTo(border, c.paper)) : near ? fill : fadeTo(fill, c.paper);
          return {
            ...data,
            color: near ? fill : fadeTo(fill, c.paper),
            borderColor: near ? border : fadeTo(border, c.paper),
            borderSize,
            dotColor: dot,
            labelColor: near ? c.ink : c.inkSoft, // faded labels keep AA contrast
            zIndex: near ? 1 : 0,
          };
        },
        edgeReducer: (edge, data) => {
          const highlighting = activeRef.current !== null || activeGroupRef.current !== null;
          if (!highlighting) return data;
          const h = highlightRef.current;
          const inChain = h.has(graph.source(edge)) && h.has(graph.target(edge));
          // Highlighted edges are the signal: darker ink and a touch thicker, so
          // the lit path reads clearly against the faded rest (CLAUDE.md: emphasise
          // the highlight rather than add a dashed style that clashes with implied links).
          return inChain
            ? { ...data, color: liveColors.ink, size: (data.size ?? 1) * EDGE_EMPHASIS }
            : { ...data, color: fadeTo(liveColors.edge, liveColors.paper) };
        },
      });

      // Open a topic on click, but not after a drag, and not if a second click follows.
      // A plain pointer or touch click grows the node's bubble, then the topic fades in (lib/nodeOpen.ts).
      // Ctrl/Cmd/Shift/Alt and middle clicks open a new tab, and reduced motion opens at once. No camera move: the
      // map is a static, horizontally-scrolled graph, so a recentering pan on click looked like an unwanted shift.
      // Keep the zoom and sideways scroll for the Back button.
      const saveView = () => {
        const cam = renderer?.getCamera().getState();
        if (cam && scrollWrap.current) saveMapView({ camera: { x: cam.x, y: cam.y, ratio: cam.ratio, angle: 0 }, scrollLeft: scrollWrap.current.scrollLeft });
      };
      const openNode = (node: string, intent: ReturnType<typeof clickIntent>) => {
        const href = `/topic/${node}`;
        if (intent === "new-tab") {
          window.open(href, "_blank", "noopener,noreferrer");
          return;
        }
        window.clearTimeout(navTimer.current);
        pendingOpen.current?.cancel();
        router.prefetch(href); // ready when the growth ends
        saveView();
        activate(node);
        if (intent === "instant") {
          navTimer.current = window.setTimeout(() => navigateWithTransition(router, href), 0);
          return;
        }
        const d = renderer!.getNodeDisplayData(node) as Record<string, unknown> | undefined;
        const at = renderer!.graphToViewport({ x: graph.getNodeAttribute(node, "x"), y: graph.getNodeAttribute(node, "y") });
        const box = container.current!.getBoundingClientRect();
        const open = playNodeOpen(
          {
            x: box.left + at.x,
            y: box.top + at.y,
            r: renderer!.scaleSize((d?.size as number) ?? NODE_RADIUS),
            border: String(d?.borderColor ?? liveColors.inkSoft),
            fill: String(d?.color ?? liveColors.paper),
            dot: String(d?.dotColor ?? d?.color ?? liveColors.paper),
            borderSize: (d?.borderSize as number) ?? 1.5,
          },
          // Runs behind the plain screen, so the page swap can take as long as it likes without a visible stall.
          async () => {
            router.push(href);
            await pageReady(href, 3500);
          },
        );
        pendingOpen.current = open;
      };
      renderer.on("clickNode", ({ node, event }) => {
        if (draggedRef.current) return;
        openNode(node, clickIntent(event.original as MouseEvent | TouchEvent, prefersReducedMotion()));
      });
      // A middle click is not a Sigma "click": open the node's page in a new tab, as a link would.
      const canvas = container.current;
      const nodeAt = (x: number, y: number) => {
        let hit: string | null = null;
        graph.forEachNode((slug, attr) => {
          const p = renderer!.graphToViewport({ x: attr.x, y: attr.y });
          const r = renderer!.scaleSize(renderer!.getNodeDisplayData(slug)?.size ?? NODE_RADIUS);
          if (Math.hypot(p.x - x, p.y - y) <= r + 2) hit = slug;
        });
        return hit;
      };
      const onMiddle = (e: MouseEvent) => {
        if (e.button !== 1 || !canvas) return;
        const box = canvas.getBoundingClientRect();
        const node = nodeAt(e.clientX - box.left, e.clientY - box.top);
        if (node) {
          e.preventDefault();
          openNode(node, "new-tab");
        }
      };
      const onMiddleDown = (e: MouseEvent) => {
        if (e.button !== 1 || !canvas) return;
        const box = canvas.getBoundingClientRect();
        if (nodeAt(e.clientX - box.left, e.clientY - box.top)) e.preventDefault(); // no autoscroll
      };
      canvas?.addEventListener("auxclick", onMiddle);
      canvas?.addEventListener("mousedown", onMiddleDown);
      removeMiddle = () => {
        canvas?.removeEventListener("auxclick", onMiddle);
        canvas?.removeEventListener("mousedown", onMiddleDown);
      };
      renderer.on("doubleClickNode", ({ event }) => {
        window.clearTimeout(navTimer.current);
        pendingOpen.current?.cancel(); // the first click of a double click had started to open the node
        pendingOpen.current = null;
        event.preventSigmaDefault();
      });
      renderer.on("doubleClickStage", ({ event }) => {
        event.preventSigmaDefault();
        if (!interactiveRef.current) return;
        const out = (event.original as MouseEvent).shiftKey;
        zoomAt(out ? 1 / 2 : 2, { x: event.x, y: event.y }, true);
      });
      renderer.on("enterNode", ({ node }) => {
        overNode.current = true;
        setCursor();
        router.prefetch(`/topic/${node}`); // ready before the click lands
        activate(nextHighlight(activeRef.current, { type: "enter", node }));
      });
      renderer.on("leaveNode", () => {
        overNode.current = false;
        setCursor();
        activate(nextHighlight(activeRef.current, { type: "leave" }));
      });
      renderer.getCamera().on("updated", (state) => {
        setFitted(isFitted(state, fitRef.current));
        // Any zoom or pan clears the highlight and tooltip.
        if (activeRef.current) activate(nextHighlight(activeRef.current, { type: "camera" }));
      });
      renderer.on("afterRender", syncPoints);

      rendererRef.current = renderer;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      removeMiddle?.();
      // The map goes away when its page is swapped. If we started that, the screen is still fading out over the new page
      // and removes itself. Any other way of leaving (a link, Back) must not leave a bubble behind.
      if (!pendingOpen.current) removeBubbles();
      renderer?.kill();
      rendererRef.current = null;
      setReady(false);
    };
  // The renderer is built once per graph; setCursor and zoomAt are stable helpers, so they are left out on purpose.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, router, activate, syncPoints]);

  // Place nodes in stage pixels and set the camera bounds to exactly the
  // padded stage, so the map fills the width and uses the full height.
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!ready || !renderer || !size.width || !size.height) return;
    const graph = renderer.getGraph();
    const viewport = Math.max(1, size.width - PADDING * 2);
    const height = Math.max(1, size.height - PADDING - PADDING_TOP);

    // Measured label widths (at full size) drive the column gaps.
    const ctx = document.createElement("canvas").getContext("2d")!;
    ctx.font = `500 ${LABEL_SIZE}px ${getComputedStyle(document.body).fontFamily}`;
    const baseWidth = new Map(cols.flat().map((n) => [n.slug, ctx.measureText(n.title).width]));

    // Phone: vertical stack. Desktop: a static horizontal map at full-size labels,
    // laid out across the width its labels need. If that is wider than the viewport,
    // the stage renders at that content width and the wrapper scrolls sideways.
    const effectiveNow: Orientation = isPhone ? "vertical" : "horizontal";
    if ((effectiveNow === "horizontal") !== fits) setFits(effectiveNow === "horizontal");

    let scale = 1;
    if (effectiveNow === "vertical") {
      // Stacked on a phone, the longest label can run past the stage edge: shrink labels
      // (never below MIN_LABEL_SCALE) until each one ends inside it.
      const probe = fitPositions(layered, "vertical", { width: viewport, height, labelWidth: baseWidth, edges: drawn }).positions;
      const room = viewport + PADDING - 8;
      scale = Math.max(
        MIN_LABEL_SCALE,
        Math.min(1, ...cols.flat().map((n) => (room - probe.get(n.slug)!.x - LABEL_START) / baseWidth.get(n.slug)!)),
      );
    }
    const labelWidth = new Map([...baseWidth].map(([slug, w]) => [slug, w * scale] as const));
    renderer.setSetting("labelSize", LABEL_SIZE * scale);
    setLabelScale(scale);

    // The width the horizontal map needs at full size; lay out across max(viewport, needed).
    const needed =
      effectiveNow === "horizontal"
        ? fitPositions(layered, "horizontal", { width: viewport, height, labelWidth, edges: drawn }).required
        : viewport;
    const width = Math.max(viewport, needed);
    const overflow = effectiveNow === "horizontal" && needed > viewport;
    setContentWidth(overflow ? width + PADDING * 2 : 0);

    // Horizontal layout reserves slots for long edges; stacked layout lists topics only.
    // With real label widths known, pick the column ordering that draws cleanly.
    const stageBox = { minX: -PADDING + 8, maxX: width + PADDING - 8, minY: -PADDING + 8, maxY: height + PADDING_TOP - TOP_CLEAR };
    const lay = effectiveNow === "horizontal" ? chooseLayers(layered, drawn, { width, height, labelWidth }, stageBox) : layered;
    const { positions } = fitPositions(lay, effectiveNow, { width, height, labelWidth, edges: drawn });
    cols.flat().forEach((n) => graph.mergeNodeAttributes(n.slug, positions.get(n.slug)!));

    const labels = new Map(cols.flat().map((n) => [n.slug, { start: LABEL_START, width: labelWidth.get(n.slug)! }]));
    const bends = edgeCurvatures(positions, drawn, slotsByEdge(lay, positions), stageBox, effectiveNow, labels);
    hiddenRef.current = hidden;
    hiddenBends.current = edgeCurvatures(positions, hidden, new Map(), stageBox, effectiveNow, labels);
    graph.forEachEdge((edge, _attr, source, target) => {
      graph.setEdgeAttribute(edge, "curvature", bends.get(`${source}->${target}`) ?? 0);
    });
    renderer.setCustomBBox({ x: [-PADDING, width + PADDING], y: [-PADDING, height + PADDING_TOP] });
    // Forced, so a change in device pixel ratio (browser zoom, moving to
    // another display) also resizes the WebGL layers, not just the labels.
    renderer.resize(true);

    // Static map: fit the full content into the stage (which is content-width when
    // overflowing), so no zoom or pan is needed and the wrapper scrolls sideways.
    const stagePixelWidth = width + PADDING * 2;
    const fit = fitRatio(stagePixelWidth, height + PADDING + PADDING_TOP, stagePixelWidth, size.height);
    fitRef.current = fit;
    const { min, max } = ratioLimits(fit);
    renderer.setSetting("minCameraRatio", min);
    renderer.setSetting("maxCameraRatio", max);
    cancelAnimation();
    setCamera(renderer.getCamera(), fitState(fit));
    // Back or Forward to the map: put the zoom, pan and sideways scroll back as they were (read once).
    if (viewToRestore.current === undefined) viewToRestore.current = takeMapView();
    const saved = viewToRestore.current;
    if (saved) {
      viewToRestore.current = null;
      if (interactive) setCamera(renderer.getCamera(), { ...saved.camera, ratio: clampRatio(saved.camera.ratio, fit) });
      scrollToRestore.current = saved.scrollLeft;
    }
    renderer.refresh();
  // Re-runs only when the layout inputs change; the saved view and camera helpers are read from refs on purpose.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, cols, layered, drawn, hidden, fits, size, isPhone]);

  // The sideways scroll can only be set once the stage has its full width.
  useEffect(() => {
    const el = scrollWrap.current;
    if (el && scrollToRestore.current !== null && (contentWidth > 0 || scrollToRestore.current === 0)) {
      el.scrollLeft = scrollToRestore.current;
      scrollToRestore.current = null;
    }
  }, [contentWidth, ready]);

  // A page restored from the back/forward cache keeps its DOM: make sure no bubble is left on it.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => e.persisted && removeBubbles();
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  // Clear the highlight on Escape, page scroll, and a touch or click outside the map.
  useEffect(() => {
    const clear = (event: HighlightEvent) => {
      if (activeRef.current) activate(nextHighlight(activeRef.current, event));
      // A clicked group is sticky: cleared by escape, scroll or a click outside,
      // but not by the pointer leaving the canvas (that is hover only).
      if (activeGroupRef.current && event.type !== "leave") activateGroup(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && clear({ type: "escape" });
    const onScroll = () => clear({ type: "scroll" });
    const onDown = (e: PointerEvent) => {
      if (!stage.current?.contains(e.target as Node)) clear({ type: "touchOutside" });
    };
    const onLeave = () => clear({ type: "leave" });
    const canvas = container.current;
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("pointerdown", onDown);
    canvas?.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("pointerdown", onDown);
      canvas?.removeEventListener("pointerleave", onLeave);
    };
  }, [activate, activateGroup, ready]);

  // Tooltip: rendered in a portal with fixed coordinates, so nothing clips it.
  const tipRef = useRef<HTMLDivElement>(null);
  const [tipPos, setTipPos] = useState<{ left: number; top: number } | null>(null);

  const activePoint = active ? points.find((p) => p.slug === active) : undefined;

  // Group labels: pinned to the stage's left edge on their row when the group
  // has one row, otherwise above (or else below) its first node, always where
  // no edge, node or label is.
  const groupLabels = useMemo(() => {
    const at = new Map(points.map((p) => [p.slug, p]));
    const ctx = typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
    if (ctx) ctx.font = `500 ${LABEL_SIZE * labelScale}px ${getComputedStyle(document.body).fontFamily}`;
    const title = new Map(nodes.map((n) => [n.slug, n.title]));
    const blocked = (x: number, y: number, w: number, h = 17) => {
      const [l, r, t, b] = [x - 4, x + w + 4, y - 3, y + h + 3];
      if (edgeSamples.points.some((p) => p.x > l && p.x < r && p.y > t && p.y < b)) return true;
      return points.some((p) => {
        const lw = ctx?.measureText(title.get(p.slug) ?? "").width ?? 0;
        const boxes = [[p.x - p.r, p.y - p.r, p.x + p.r, p.y + p.r], [p.x + p.r + 8, p.y - 11, p.x + p.r + 8 + lw, p.y + 11]];
        return boxes.some(([bl, bt, br, bb]) => l < br && r > bl && t < bb && b > bt);
      });
    };
    const names = [...new Set(nodes.map((n) => n.group).filter((g): g is string => !!g))];
    return names.flatMap((name) => {
      const pts = nodes.filter((n) => n.group === name).map((n) => at.get(n.slug)).filter((p): p is Point => !!p);
      if (!pts.length) return [];
      const width = name.length * 7.5; // 18px serif, as drawn by .graph-group
      const first = pts[0]; // first in index order
      const spots = groupLabelSpots(first, width, ctx?.measureText(title.get(first.slug) ?? "").width ?? 0, effective === "vertical");
      const fits = (sp: { x: number }) => sp.x >= 0 && sp.x + width <= (size.width || Infinity);
      const spot = placeGroupLabel(spots, fits, (sp) => blocked(sp.x, sp.y, width));
      return [{ name, ...spot }];
    });
  }, [points, nodes, edgeSamples, size.width, effective, labelScale]);
  const activeNode = active ? bySlug.get(active) : undefined;

  // Right edge of each column's widest label. The sideways scroll snaps so its window ends on one of
  // these (or at the stage's end), which keeps the cut between columns instead of through a label.
  const snapEnds = useMemo(() => {
    if (effective !== "horizontal" || !contentWidth) return [];
    const ctx = typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
    if (!ctx) return [];
    ctx.font = `500 ${LABEL_SIZE * labelScale}px ${getComputedStyle(document.body).fontFamily}`;
    const title = new Map(nodes.map((n) => [n.slug, n.title]));
    const ends = new Map<number, number>();
    for (const p of points) {
      const column = Math.round(p.x);
      const end = p.x + p.r + 8 + ctx.measureText(title.get(p.slug) ?? "").width;
      ends.set(column, Math.max(ends.get(column) ?? 0, end));
    }
    return [...ends.values()];
  }, [points, nodes, effective, labelScale, contentWidth]);

  // Whether the map can still be scrolled to the right: drives the quiet "Scroll sideways" cue.
  const [moreToScroll, setMoreToScroll] = useState(false);
  useEffect(() => {
    const el = scrollWrap.current;
    if (!el) return;
    const update = () => setMoreToScroll(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [contentWidth, ready]);

  useLayoutEffect(() => {
    const tip = tipRef.current;
    const box = stage.current?.getBoundingClientRect();
    if (!tip || !box || !activePoint) return setTipPos(null);
    const pos = placeTooltip(
      { x: box.left + activePoint.x, y: box.top + activePoint.y, r: activePoint.r },
      { w: tip.offsetWidth, h: tip.offsetHeight },
      { w: document.documentElement.clientWidth, h: window.innerHeight },
    );
    setTipPos((prev) => (prev && prev.left === pos.left && prev.top === pos.top ? prev : { left: pos.left, top: pos.top }));
  }, [activePoint]);

  return (
    <>
      <div className="graph-toolbar">
        <p className="graph-legend label" data-tour="states">
          <LegendMark state="unread" /> Unread
          <LegendMark state="ready" /> Ready
          <LegendMark state="progress" /> In progress
          <LegendMark state="read" /> Read
        </p>
        <div className="graph-toolbar-end">
          <span className="graph-scroll-cue label" data-shown={moreToScroll || undefined} aria-hidden="true">
            Scroll sideways for more
          </span>
          {/* One button, for the zoom or pan a stray click can cause. Only on a map that can zoom and pan. */}
          {interactive && (
            <button type="button" className="text-button label graph-fit" onClick={fitAll} disabled={fitted}>
              Fit to size
            </button>
          )}
        </div>
      </div>

      <div ref={scrollWrap} className="graph-scrollwrap">
        {/* Snap points live here, not in the stage: the stage clips, so it is its own scroll container. */}
        {snapEnds.map((end) => (
          <span key={end} className="graph-snap" aria-hidden="true" style={{ left: end }} />
        ))}
        {snapEnds.length > 0 && <span className="graph-snap" aria-hidden="true" style={{ left: contentWidth - 1 }} />}
        <div
          ref={stage}
          className="graph-stage"
          data-tour="map"
          role="group"
          aria-label="Topic map"
          // Stage height comes from the layout; CSS picks one per breakpoint (no shift on load).
          data-orientation={effective}
          data-label-size={Math.round(LABEL_SIZE * labelScale * 10) / 10}
          // Only an interactive map captures touch (to pan/zoom); a fixed small map
          // must let a finger scroll the page past it.
          data-interactive={interactive || undefined}
          style={{ "--rows": rowCount(layered, "horizontal"), "--layers": rowCount(layered, "vertical"), width: contentWidth || undefined } as React.CSSProperties}
        >
        {!ready && <GraphSkeleton />}
        <div ref={container} className="graph-canvas" aria-hidden="true" />

        {/* Faint group names: click one to highlight just that group's topics. */}
        {groupLabels.map((g) => (
          <button
            key={g.name}
            type="button"
            className="graph-group label"
            style={{ left: g.x, top: g.y }}
            aria-pressed={activeGroup === g.name}
            aria-label={`Highlight the ${g.name} topics`}
            onClick={() => activateGroup(g.name)}
          >
            {g.name}
          </button>
        ))}

        {/* Edges implied by a longer path: faint and dashed, on hover or focus of either end, or always with "Show all links". */}
        <svg className="graph-extra" aria-hidden="true">
          {extraPaths
            .filter((p) => (interactive && showAll) || active === p.from || active === p.to)
            .map((p) => (
              <path key={`${p.from}->${p.to}`} d={p.d} />
            ))}
        </svg>

        {/* Invisible links over each node: keyboard focus and screen readers. */}
        {points.map((p) => {
          const n = bySlug.get(p.slug)!;
          const isRead = read.includes(p.slug);
          const isReady = !isRead && (prereqs.get(p.slug) ?? []).every((q) => read.includes(q));
          return (
            <IntentLink
              key={p.slug}
              href={`/topic/${p.slug}`}
              className="graph-node-link"
              style={{ left: p.x, top: p.y, width: p.r * 2 + 6, height: p.r * 2 + 6 }}
              aria-label={`${n.title}, ${n.posts} ${n.posts === 1 ? "post" : "posts"}, ${isRead ? "read" : isReady ? "ready to read" : "unread"}`}
              onFocus={() => activate(nextHighlight(activeRef.current, { type: "focus", node: p.slug }))}
              onBlur={() => activate(nextHighlight(activeRef.current, { type: "blur" }))}
            />
          );
        })}

        {activePoint &&
          activeNode &&
          createPortal(
            <div
              ref={tipRef}
              className="graph-tooltip"
              role="tooltip"
              style={tipPos ? { left: tipPos.left, top: tipPos.top } : { left: 0, top: 0, visibility: "hidden" }}
            >
              <strong>{activeNode.title}</strong>
              {activeNode.concept && <span className="tip-desc">{firstSentence(activeNode.concept)}</span>}
              {(() => {
                const pre = prereqs.get(activeNode.slug) ?? [];
                const isRead = read.includes(activeNode.slug);
                const pending = pre.filter((q) => !read.includes(q));
                const isReady = !isRead && pending.length === 0;
                const status = isRead ? "Read" : isReady ? "Ready to read" : "Not ready yet";
                const lines = prerequisiteLines(pre, read, (q) => bySlug.get(q)?.title ?? q);
                return (
                  <>
                    <span className="tip-status">
                      {status}
                    </span>
                    {lines.builtOn && <span>{lines.builtOn}</span>}
                    {lines.finish && <span className="tip-why">{lines.finish}</span>}
                  </>
                );
              })()}
            </div>,
            document.body,
          )}
        </div>
      </div>
    </>
  );
}

/** Legend icons drawn like the nodes: thin ring, thick ring with a centre dot, filled rust. */
function LegendMark({ state }: { state: "unread" | "ready" | "progress" | "read" }) {
  return (
    <svg className="legend-mark" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      {state === "read" ? (
        <circle cx="8" cy="8" r="7" fill="var(--accent)" />
      ) : state === "progress" ? (
        <circle cx="8" cy="8" r="5.5" fill="var(--paper)" stroke="var(--accent)" strokeWidth="3" />
      ) : (
        <circle cx="8" cy="8" r={state === "ready" ? 5.5 : 6.25} fill="var(--paper)" stroke="var(--ink-soft)" strokeWidth={state === "ready" ? 3 : 1.5} />
      )}
      {state === "ready" && <circle cx="8" cy="8" r="1.6" fill="var(--ink-soft)" />}
      {state === "progress" && <circle cx="8" cy="8" r="1.6" fill="var(--accent)" />}
    </svg>
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
