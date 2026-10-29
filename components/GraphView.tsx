"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NODE_RADIUS, MIN_LABEL_SCALE, chooseLayers, columns, fitPositions, layers, rowCount, slotsByEdge, transitiveReduction, type Orientation } from "@/lib/graph";
import { useInProgressTopics, useReadTopics } from "@/lib/progress";
import { groupSet, highlightSet, mapIsInteractiveAt, nextHighlight, nextStation, placeTooltip, prerequisiteLines, type HighlightEvent } from "@/lib/graphUi";
import { createPortal } from "react-dom";
import { LABEL_BASELINE, LABEL_LEFT, edgeId, handRing, ringFor, routeEdges, routeHidden, routeShape } from "@/lib/metroRoute";
import { readyTopics } from "@/lib/nextUp";
import { DURATION, easeInOut, prefersReducedMotion } from "@/lib/motion";
import { navigateWithTransition, pageReady } from "./ViewTransitions";
import { clickIntent, playNodeOpen, removeBubbles, stationSpec } from "@/lib/nodeOpen";
import { saveMapView, takeMapView } from "@/lib/mapView";
import { DESKTOP, PHONE } from "@/lib/breakpoints";
import StateLegend from "./StateLegend";
import { firstSentence } from "@/lib/stationSign";
import {
  STEP,
  clampPan,
  revealDelta,
  dragView,
  fitRatio,
  fitState,
  isFitted,
  moveView,
  clampRatio,
  wheelFactor,
  zoomBy,
  type Camera,
} from "@/lib/camera";

type GraphNode = { slug: string; title: string; posts: number; group?: string; concept?: string };
type GraphEdge = { from: string; to: string };

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Called with the hovered or focused station, or null, so the station sign can follow it. */
  onActive?: (slug: string | null) => void;
};

type P = { x: number; y: number };
/** What the layout effect decides, in stage pixels (y down). The camera maps these to the screen. */
type Layout = { W: number; H: number; fit: number; px: Map<string, P>; routes: Map<string, P[]>; hiddenRoutes: Map<string, P[]>; labelWidth: Map<string, number> };

const LABEL_SIZE = 18;
const NARROW = PHONE; // below this the map stacks top to bottom; matches the CSS and the mobile Path default
const PADDING = 48; // px between the stage edge and the outermost nodes
const PADDING_TOP = 58; // node centres sit this far below the stage top, so the first row clears the top rule and the edges stay TOP_CLEAR below it
const TOP_CLEAR = 24; // edges stay this far below the legend and controls line
const HIT_RADIUS = 22; // 44px pointer and touch target around each node
const CLICK_SLOP = 5; // px a pointer may move before a press becomes a drag

const TIP_DELAY_MS = 300;
const TIP_COOL_MS = 150;

const NO_NODES = new Set<string>();

export default function GraphView({ nodes, edges, onActive }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const scrollWrap = useRef<HTMLDivElement>(null);
  const container = useRef<SVGSVGElement>(null);
  const edgesRef = useRef(edges);
  edgesRef.current = edges;
  const activeRef = useRef<string | null>(null);
  const activeGroupRef = useRef<string | null>(null);
  const router = useRouter();
  const read = useReadTopics();
  const inProgress = useInProgressTopics();

  const [ready, setReady] = useState(false);
  // True once the layout effect has put every node in place; until then the skeleton stands in.
  const [placed, setPlaced] = useState(false);
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  // Phones get a fixed, non-interactive map so a finger scrolls the page past
  // it and a tap opens the topic. Starts false (desktop-first) to match SSR,
  // then follows the NARROW media query. See the orientation effect below.
  const [isPhone, setIsPhone] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [active, setActive] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  // What the one polite live region says (prerequisites of the station keyboard focus is on).
  const [announce, setAnnounce] = useState("");
  // The stage's pixel width when the horizontal map is wider than the viewport
  // (so the wrapper scrolls); 0 means it fits, and the stage fills the viewport.
  const [contentWidth, setContentWidth] = useState(0);
  const [layout, setLayout] = useState<Layout | null>(null);
  const layoutRef = useRef<Layout | null>(null);
  const [cam, setCam] = useState<Camera>(fitState(1));
  const camRef = useRef<Camera>(fitState(1));

  // Draw only the transitive reduction; the full edge set still drives
  // neighbours, ready state and the "Also builds on" hints.
  const drawn = useMemo(() => transitiveReduction(edges), [edges]);
  const hidden = useMemo(() => edges.filter((e) => !drawn.includes(e)), [edges, drawn]);
  const prereqs = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const e of edges) m.set(e.to, [...(m.get(e.to) ?? []), e.from]);
    return m;
  }, [edges]);
  const cols = useMemo(() => columns(nodes, drawn), [nodes, drawn]);
  const layered = useMemo(() => layers(nodes, drawn), [nodes, drawn]);

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
    return () => observer.disconnect();
  }, []);

  const activate = useCallback((slug: string | null) => {
    // A pinned group keeps its highlight while the pointer or focus moves over nodes: only the tooltip follows.
    if (activeGroupRef.current) return setActive(slug);
    activeRef.current = slug;
    setActive(slug);
  }, []);

  // Clicking a group label highlights just that group's nodes and fades the
  // rest. A second click on the same group, or any node/escape/scroll, clears it.
  const activateGroup = useCallback((name: string | null) => {
    const next = name === activeGroupRef.current ? null : name;
    activeRef.current = null;
    setActive(null);
    activeGroupRef.current = next;
    setActiveGroup(next);
  }, []);

  // ── Camera ────────────────────────────────────────────────────────────
  // Camera state is the one lib/camera.ts keeps: x and y are the view centre in framed units (one unit is the stage's
  // longer side), ratio grows as you zoom out. Node and edge geometry is recomputed in screen pixels from it, so
  // strokes, labels and the 44px targets keep their size at any zoom.
  const fitRef = useRef(1);
  /** The view is the fitted one, so the fit button has nothing to do. */
  const [fitted, setFitted] = useState(true);
  // Small maps fit on screen: no zoom, pan or controls until there are enough
  // topics to need them. Phones always get the fixed map, whatever the count,
  // so a finger scrolls the page past it and a tap opens the topic.
  const interactive = mapIsInteractiveAt(nodes.length, isPhone);
  const animFrame = useRef(0);
  /** The view saved when a node was opened, if the map is being returned to by Back or Forward (undefined: not read yet). */
  const viewToRestore = useRef<ReturnType<typeof takeMapView> | undefined>(undefined);
  const scrollToRestore = useRef<number | null>(null);
  const draggedRef = useRef(false);
  const dragging = useRef(false);

  const setCursor = useCallback(() => {
    const el = container.current;
    if (el) el.style.cursor = dragging.current ? "grabbing" : "";
  }, []);

  const cancelAnimation = useCallback(() => {
    cancelAnimationFrame(animFrame.current);
    animFrame.current = 0;
  }, []);

  const commitCamera = useCallback(
    (next: Camera) => {
      camRef.current = next;
      setCam(next);
      setFitted(isFitted(next, fitRef.current));
      // Any zoom or pan clears the highlight and tooltip.
      if (activeRef.current) activate(nextHighlight(activeRef.current, { type: "camera" }));
    },
    [activate],
  );

  /** Set the camera, animating unless reduced motion is on. Any running animation is cancelled first. */
  const applyCamera = useCallback(
    (next: Camera, animate: boolean) => {
      cancelAnimation();
      if (!animate || prefersReducedMotion()) {
        commitCamera(next);
        return;
      }
      const from = camRef.current;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION.slow);
        if (t >= 1) {
          // Land exactly on the target, so Fit all always gives the identical state.
          commitCamera(next);
          animFrame.current = 0;
          return;
        }
        const e = easeInOut(t);
        commitCamera({
          x: from.x + (next.x - from.x) * e,
          y: from.y + (next.y - from.y) * e,
          ratio: from.ratio * Math.pow(next.ratio / from.ratio, e),
          angle: 0,
        });
        animFrame.current = requestAnimationFrame(step);
      };
      animFrame.current = requestAnimationFrame(step);
    },
    [cancelAnimation, commitCamera],
  );

  /** Framed point under a stage point (pixels from the stage's top left), at the current camera. */
  const framed = useCallback((p: P) => {
    const L = layoutRef.current!;
    const c = camRef.current;
    const k = Math.max(L.W, L.H) * (L.fit / c.ratio);
    return { x: c.x + (p.x - L.W / 2) / k, y: c.y + (p.y - L.H / 2) / k };
  }, []);

  /** Zoom by a factor around a stage point (the pointer). */
  const zoomAt = useCallback(
    (factor: number, at: P, animate: boolean) => {
      const L = layoutRef.current;
      if (!L) return;
      applyCamera(zoomBy(camRef.current, factor, framed(at), L.fit), animate);
    },
    [applyCamera, framed],
  );

  /** Move the view by a screen distance, keeping part of the graph on screen. */
  const panBy = useCallback(
    (dx: number, dy: number) => {
      const L = layoutRef.current;
      if (!L) return;
      const U = Math.max(L.W, L.H);
      const cam0 = camRef.current;
      const k = U * (L.fit / cam0.ratio);
      const pts = [...L.px.values()].map((p) => ({ x: 0.5 + (p.x - L.W / 2) / U, y: 0.5 + (p.y - L.H / 2) / U }));
      const box = {
        minX: Math.min(...pts.map((p) => p.x)),
        maxX: Math.max(...pts.map((p) => p.x)),
        minY: Math.min(...pts.map((p) => p.y)),
        maxY: Math.max(...pts.map((p) => p.y)),
      };
      const moved = moveView(cam0, { x: dx / k, y: dy / k });
      applyCamera(clampPan(moved, box, { width: L.W, height: L.H }, 1 / (U * L.fit)), false);
    },
    [applyCamera],
  );

  /** Fit all: the fitted camera, which also clears the hovered or focused topic. */
  const fitAll = useCallback((animate = true) => {
    activate(null);
    if (stage.current?.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
    applyCamera(fitState(fitRef.current), animate);
  }, [activate, applyCamera]);

  const zoomCenter = useCallback(
    (factor: number) => {
      const cam0 = camRef.current;
      applyCamera(zoomBy(cam0, factor, { x: cam0.x, y: cam0.y }, fitRef.current), false); // only keys call this, and keys never animate
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
    const pointers = new Map<number, P>();
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
        // Capture only once it is a drag: capturing on press would send the click to the map instead of the node.
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
    const onDouble = (e: MouseEvent) => {
      if ((e.target as Element).closest(".graph-node-link")) return;
      zoomAt(e.shiftKey ? 1 / 2 : 2, local(e), true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") zoomCenter(STEP);
      else if (e.key === "-" || e.key === "_") zoomCenter(1 / STEP);
      else if (e.key === "0") fitAll(false);
      else return;
      e.preventDefault();
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("dblclick", onDouble);
    host.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("dblclick", onDouble);
      host.removeEventListener("keydown", onKey);
      cancelAnimation();
    };
  }, [ready, interactive, setCursor, cancelAnimation, zoomAt, panBy, zoomCenter, fitAll]);

  // Phones only get the Path view (HomeView swaps GraphView out right after its first render), so they skip the layout.
  // Going wider than 767px makes HomeView mount GraphView again. Waits for the fonts, so labels are measured true.
  useEffect(() => {
    if (!window.matchMedia(DESKTOP).matches) return;
    let cancelled = false;
    document.fonts.ready.then(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
      setReady(false);
      setPlaced(false);
    };
  }, [nodes, edges]);

  // Place nodes in stage pixels. The stage is as wide as the layout needs and the camera starts fitted.
  useEffect(() => {
    if (!ready || !size.width || !size.height) return;
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
        Math.min(1, ...cols.flat().map((n) => (room - probe.get(n.slug)!.x + LABEL_LEFT) / baseWidth.get(n.slug)!)),
      );
    }
    const labelWidth = new Map([...baseWidth].map(([slug, w]) => [slug, w * scale] as const));
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

    // The layout is y up from the stage's bottom; the SVG is y down from its top.
    const px = new Map<string, P>();
    for (const n of cols.flat()) {
      const pos = positions.get(n.slug)!;
      px.set(n.slug, { x: pos.x + PADDING, y: height + PADDING_TOP - pos.y });
    }
    // Metro routes (lib/metroRoute.ts): elbows with 45-degree chamfers; long edges pass through their reserved corridors.
    // Stacked (a phone, which has no map) is plain straight lines.
    const slots = slotsByEdge(lay, positions);
    const route = (list: GraphEdge[], through: boolean) =>
      effectiveNow === "horizontal"
        ? routeEdges(px, list.map((e) => ({ from: e.from, to: e.to, via: through ? (slots.get(edgeId(e)) ?? []).map((q) => ({ x: q.x + PADDING, y: height + PADDING_TOP - q.y })) : [] })), labelWidth)
        : new Map(list.map((e): [string, P[]] => [edgeId(e), [px.get(e.from)!, px.get(e.to)!]]));
    const routes = route(drawn, true);
    const hiddenRoutes = effectiveNow === "horizontal" ? routeHidden(px, hidden, labelWidth) : route(hidden, false);

    // Static map: fit the full content into the stage (which is content-width when
    // overflowing), so no zoom or pan is needed and the wrapper scrolls sideways.
    const W = width + PADDING * 2;
    const fit = fitRatio(W, height + PADDING + PADDING_TOP, W, size.height);
    fitRef.current = fit;
    const next: Layout = { W, H: size.height, fit, px, routes, hiddenRoutes, labelWidth };
    // The layout runs again for small reasons (fonts, a scrollbar, the topic list); a stage of the same size keeps the
    // camera the reader has (or Back just restored). A different size starts fitted.
    const prev = layoutRef.current;
    const keepCamera = !!prev && prev.W === W && prev.H === next.H && prev.fit === fit;
    layoutRef.current = next;
    setLayout(next);
    cancelAnimation();
    commitCamera(keepCamera ? camRef.current : fitState(fit));
    // Back or Forward to the map: put the zoom, pan and sideways scroll back as they were (read once).
    if (viewToRestore.current === undefined) viewToRestore.current = takeMapView();
    const saved = viewToRestore.current;
    if (saved) {
      viewToRestore.current = null;
      if (interactive) commitCamera({ ...saved.camera, ratio: clampRatio(saved.camera.ratio, fit) });
      scrollToRestore.current = saved.scrollLeft;
    }
    setPlaced(true);
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

  // Clear the highlight on Escape, page scroll, and a touch or click outside the map.
  useEffect(() => {
    const clear = (event: HighlightEvent) => {
      if (activeRef.current) activate(nextHighlight(activeRef.current, event));
      // A clicked group is sticky: cleared by escape, scroll or a click outside,
      // but not by the pointer leaving the canvas (that is hover only).
      if (activeGroupRef.current && event.type !== "leave") activateGroup(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAnnounce("");
      clear({ type: "escape" });
    };
    const onScroll = () => clear({ type: "scroll" });
    const onDown = (e: PointerEvent) => {
      // The group row is part of the map: its own click toggles the group, so pressing it must not clear it first.
      if (!stage.current?.contains(e.target as Node) && !(e.target as Element).closest?.(".graph-groups")) clear({ type: "touchOutside" });
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

  // Screen pixels (inside the stage) of every node at the current camera, and the mapping itself.
  const view = useMemo(() => {
    if (!layout) return null;
    const { W, H, fit } = layout;
    const U = Math.max(W, H);
    const s = fit / cam.ratio;
    const to = (p: P): P => ({ x: W / 2 + (p.x - W / 2) * s + (0.5 - cam.x) * U * s, y: H / 2 + (p.y - H / 2) * s + (0.5 - cam.y) * U * s });
    return { to, pos: new Map([...layout.px].map(([slug, p]) => [slug, to(p)] as const)) };
  }, [layout, cam]);
  const points = useMemo(() => (view ? nodes.flatMap((n) => (view.pos.has(n.slug) ? [{ slug: n.slug, ...view.pos.get(n.slug)!, r: NODE_RADIUS }] : [])) : []), [view, nodes]);

  // The ring goes round the station the reader is on: a topic in progress, else the best ready one (as the Next up
  // button picks it, without the lesson metadata it also weighs, so it can differ when several are started).
  const current = useMemo(() => {
    const started = inProgress.find((slug) => bySlug.has(slug) && !read.includes(slug));
    if (started) return started;
    if (read.length === 0) return cols[0]?.[0]?.slug ?? null; // "Start with", the map's first topic
    const entries = nodes.map((n) => ({ slug: n.slug, title: n.title, prerequisites: prereqs.get(n.slug) ?? [] }));
    return readyTopics(entries, read)[0]?.slug ?? null;
  }, [inProgress, read, nodes, prereqs, bySlug, cols]);
  // Opaque while something is highlighted: the node, its prerequisite chain and dependents, or a clicked group.
  const highlighting = active !== null || activeGroup !== null;
  const lit = useMemo(
    () => (activeGroup ? groupSet(activeGroup, nodes) : active ? highlightSet(active, edges) : NO_NODES),
    [activeGroup, active, nodes, edges],
  );

  // Open a topic from a click. Ctrl, Cmd, Shift, Alt and middle clicks are left to the browser (a new tab), reduced motion
  // and clicks a script made go at once, and a plain pointer or touch click grows the station's bubble while the topic
  // loads behind it (lib/nodeOpen.ts). The camera and sideways scroll are saved for the Back button either way.
  const pendingOpen = useRef<{ cancel: () => void; isActive: () => boolean } | null>(null);
  const openNode = (e: React.MouseEvent<Element>, slug: string) => {
    if (draggedRef.current) return e.preventDefault();
    const intent = clickIntent(e.nativeEvent, prefersReducedMotion());
    if (intent === "new-tab") return;
    e.preventDefault();
    // A second click, or the second of a double click, cancels the opening instead of starting another.
    if (pendingOpen.current?.isActive() || e.detail > 1) {
      pendingOpen.current?.cancel();
      pendingOpen.current = null;
      return;
    }
    const href = `/topic/${slug}`;
    router.prefetch(href); // ready when the growth ends
    if (scrollWrap.current) saveMapView({ camera: camRef.current, scrollLeft: scrollWrap.current.scrollLeft });
    const shape = e.currentTarget.querySelector(".graph-node-shape");
    const dot = e.currentTarget.querySelector(".graph-node-dot");
    if (intent === "instant" || !shape || !dot) return navigateWithTransition(router, href);
    activate(slug);
    const paint = getComputedStyle(shape);
    pendingOpen.current = playNodeOpen(
      stationSpec(shape.getBoundingClientRect(), {
        stroke: paint.stroke,
        fill: paint.fill,
        strokeWidth: parseFloat(paint.strokeWidth),
        dot: getComputedStyle(dot).fill,
        dotRadius: Number(dot.getAttribute("r")),
      }),
      // Runs behind the plain screen, so the page swap can take as long as it likes without a visible stall.
      async () => {
        router.push(href);
        await pageReady(href, 3500);
      },
    );
  };

  // A page restored from the back/forward cache keeps its DOM: make sure no bubble is left on it. Leaving the map any
  // other way than opening a node also clears them; after opening one, the screen is still fading out over the new page.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => e.persisted && removeBubbles();
    window.addEventListener("pageshow", onShow);
    return () => {
      window.removeEventListener("pageshow", onShow);
      if (!pendingOpen.current) removeBubbles();
    };
  }, []);

  // Arrow keys move between stations (see nextStation); one polite live region says where focus landed.
  const moveFocus = (e: React.KeyboardEvent<Element>, slug: string) => {
    if (!layout || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    const to = nextStation(e.key, slug, layout.px, drawn);
    if (e.key.startsWith("Arrow")) e.preventDefault(); // at the end of a column or line the browser must not scroll the map instead
    if (!to) return;
    // Focus without the browser's own scrolling, then bring the station (and the start of its label) into view: the
    // camera pans when it is zoomed, and the sideways scroll of the map moves when it is wider than the window. The page
    // itself never scrolls.
    stage.current?.querySelector<HTMLElement>(`.graph-node-link[href="/topic/${to}"]`)?.focus({ preventScroll: true });
    const p = view?.pos.get(to);
    const wrap = scrollWrap.current;
    if (!p || !wrap) return;
    const label = Math.min(layout.labelWidth.get(to) ?? 0, 220);
    if (!fitted) panBy(revealDelta(p.x, 0, layout.W, 40, 40 + label), revealDelta(p.y, 0, layout.H, 60, 80));
    else {
      const need = revealDelta(p.x - wrap.scrollLeft, 0, wrap.clientWidth, 40, 40 + label);
      if (!need) return;
      // The wrapper snaps its sideways scroll so the window ends on a column mark: land on a mark that still shows the
      // station and its label, the nearest one to where it would have gone, so the browser has nothing to correct.
      const want = wrap.scrollLeft + need;
      const ends = [...snapEnds, wrap.scrollWidth].filter((end) => end - wrap.clientWidth <= p.x - 40 && end >= p.x + 40 + label);
      const end = ends.sort((m, n) => Math.abs(m - wrap.clientWidth - want) - Math.abs(n - wrap.clientWidth - want))[0];
      wrap.scrollLeft = end === undefined ? want : end - wrap.clientWidth;
    }
  };
  // The link's own name already says the title and state; the live region adds what it builds on.
  const say = (slug: string) => {
    const pre = prereqs.get(slug) ?? [];
    const lines = prerequisiteLines(pre, read, (q) => bySlug.get(q)?.title ?? q);
    setAnnounce([lines.builtOn ?? (pre.length ? "" : "Builds on nothing."), lines.finish ?? ""].filter(Boolean).join(" "));
  };

  // Tooltip: rendered in a portal with fixed coordinates, so nothing clips it.
  const tipRef = useRef<HTMLDivElement>(null);
  const [tipPos, setTipPos] = useState<{ left: number; top: number } | null>(null);

  // The first tooltip waits TIP_DELAY_MS; moving to a neighbouring node shows the next at once, until TIP_COOL_MS passes with none.
  const [tipReady, setTipReady] = useState(false);
  const tipWarm = useRef(false);
  const tipByKey = useRef(false); // the active node came from keyboard focus: no delay
  useEffect(() => {
    if (active) {
      if (tipWarm.current || tipByKey.current) return setTipReady(true);
      const t = window.setTimeout(() => ((tipWarm.current = true), setTipReady(true)), TIP_DELAY_MS);
      return () => window.clearTimeout(t);
    }
    setTipReady(false);
    const t = window.setTimeout(() => (tipWarm.current = false), TIP_COOL_MS);
    return () => window.clearTimeout(t);
  }, [active]);

  const activePoint = active && tipReady ? points.find((p) => p.slug === active) : undefined;

  // The group names shown in the row above the map, with how many topics each holds.
  const groupNames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of nodes) if (n.group) counts.set(n.group, (counts.get(n.group) ?? 0) + 1);
    return [...counts];
  }, [nodes]);
  const activeNode = active ? bySlug.get(active) : undefined;

  // Right edge of each column's widest label. The sideways scroll snaps so its window ends on one of
  // these (or at the stage's end), which keeps the cut between columns instead of through a label.
  const snapEnds = useMemo(() => {
    if (effective !== "horizontal" || !contentWidth || !layout) return [];
    const ctx = typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
    if (!ctx) return [];
    ctx.font = `500 ${LABEL_SIZE * labelScale}px ${getComputedStyle(document.body).fontFamily}`;
    const ends = new Map<number, number>();
    for (const n of nodes) {
      const p = layout.px.get(n.slug);
      if (!p) continue;
      const column = Math.round(p.x);
      ends.set(column, Math.max(ends.get(column) ?? 0, p.x - LABEL_LEFT + ctx.measureText(n.title).width));
    }
    return [...ends.values()];
  }, [layout, nodes, effective, labelScale, contentWidth]);

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
        <div className="graph-toolbar-end">
          <span className="graph-scroll-cue label" data-shown={moreToScroll || undefined} aria-hidden="true">
            Scroll sideways for more
          </span>
          {/* One button, for the zoom or pan a stray click can cause. Only on a map that can zoom and pan. */}
          {interactive && (
            <button type="button" className="text-button label graph-fit" onClick={() => fitAll()} disabled={fitted}>
              Fit to size
            </button>
          )}
        </div>
      </div>

      <div className="graph-groups label" role="group" aria-label="Highlight a group of topics">
        {groupNames.map(([name, count]) => (
          <button key={name} type="button" className="graph-group" aria-label={`${name}, ${count} topics`} aria-pressed={activeGroup === name} onClick={() => activateGroup(name)}>
            {name} <span aria-hidden="true">·</span> {count}
          </button>
        ))}
      </div>

      <div className="graph-frame">
      {/* Crop marks: hairline ticks just outside each corner of the chart, decoration only. */}
      <svg className="graph-crop" style={{ left: -22, top: -22 }} aria-hidden="true"><path d="M22 10V0M10 22H0" /></svg>
      <svg className="graph-crop" style={{ right: -22, top: -22 }} aria-hidden="true"><path d="M0 10V0M12 22H22" /></svg>
      <svg className="graph-crop" style={{ left: -22, bottom: -22 }} aria-hidden="true"><path d="M22 12V22M10 0H0" /></svg>
      <svg className="graph-crop" style={{ right: -22, bottom: -22 }} aria-hidden="true"><path d="M0 12V22M12 0H22" /></svg>
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
        {!placed && <GraphSkeleton />}
        <div className="visually-hidden" aria-live="polite">
          {announce}
        </div>
        <svg ref={container} role="group" aria-label="Topics" aria-hidden={placed ? undefined : true} className="graph-canvas" style={placed ? undefined : { visibility: "hidden" }}>
          {layout && view && (
            <>
              <g aria-hidden="true">
                {/* Edges implied by a longer path: faint and dashed, on hover or focus of either end, or always with "Show all links". */}
                {hidden
                  .filter((e) => (interactive && showAll) || (!activeGroup && (active === e.from || active === e.to)))
                  .map((e) => {
                    const pts = layout.hiddenRoutes.get(edgeId(e));
                    if (!pts) return null;
                    const shape = routeShape(pts.map(view.to), NODE_RADIUS, false);
                    return <path key={edgeId(e)} className="graph-edge graph-edge-extra" d={shape.d} />;
                  })}
                {drawn.map((e) => {
                  const pts = layout.routes.get(edgeId(e));
                  if (!pts) return null;
                  const inChain = highlighting && lit.has(e.from) && lit.has(e.to);
                  const faded = highlighting && !inChain;
                  const shape = routeShape(pts.map(view.to), NODE_RADIUS);
                  return (
                    <g key={edgeId(e)}>
                      <path className="graph-edge" d={shape.d} data-lit={inChain || undefined} data-faded={faded || undefined} />
                      <polygon className="graph-edge-head" points={shape.head} data-lit={inChain || undefined} data-faded={faded || undefined} />
                    </g>
                  );
                })}
                {/* The current station: a hand-drawn ring in the second ink, drawn once and never animated. */}
                {current && view.pos.has(current) && (
                  <path
                    className="graph-ring"
                    d={(() => {
                      const { cx, cy, rx, ry } = ringFor(view.pos.get(current)!, layout.labelWidth.get(current) ?? 100);
                      return handRing(cx, cy, rx, ry);
                    })()}
                  />
                )}
              </g>

              {/* Each node is a real link: keyboard focus, middle and Ctrl click, and screen readers all work. */}
              {nodes.map((n) => {
                const p = view.pos.get(n.slug);
                if (!p) return null;
                const isRead = read.includes(n.slug);
                const inProg = !isRead && inProgress.includes(n.slug);
                const isReady = !isRead && (prereqs.get(n.slug) ?? []).every((q) => read.includes(q));
                const near = !highlighting || lit.has(n.slug);
                const faded = !near || undefined;
                return (
                  <g
                    key={n.slug}
                    className="graph-node"
                    data-read={isRead || undefined}
                    data-progress={inProg || undefined}
                    data-ready={(isReady && !inProg) || undefined}
                    data-lit={(highlighting && near) || undefined}
                    data-active={(!activeGroup && active === n.slug) || undefined}
                    data-faded={faded}
                  >
                    <a
                      className="graph-node-link"
                      href={`/topic/${n.slug}`}
                      data-own-transition=""
                      aria-label={`${n.title}, ${n.posts} ${n.posts === 1 ? "post" : "posts"}, ${isRead ? "read" : inProg ? "in progress" : isReady ? "ready to read" : "unread"}`}
                      onClick={(e) => openNode(e, n.slug)}
                      onKeyDown={(e) => moveFocus(e, n.slug)}
                      onPointerEnter={() => {
                        router.prefetch(`/topic/${n.slug}`); // ready before the click lands
                        tipByKey.current = false;
                        activate(nextHighlight(activeRef.current, { type: "enter", node: n.slug }));
                        onActive?.(n.slug);
                      }}
                      onPointerLeave={() => {
                        activate(nextHighlight(activeRef.current, { type: "leave" }));
                        onActive?.(null);
                      }}
                      onFocus={(e) => {
                        router.prefetch(`/topic/${n.slug}`);
                        tipByKey.current = e.currentTarget.matches(":focus-visible");
                        if (tipByKey.current) say(n.slug);
                        activate(nextHighlight(activeRef.current, { type: "focus", node: n.slug }));
                        onActive?.(n.slug); // not from `active`: a page scroll clears that, and focus itself can scroll
                      }}
                      onBlur={() => {
                        setAnnounce("");
                        activate(nextHighlight(activeRef.current, { type: "blur" }));
                        onActive?.(null);
                      }}
                    >
                      <circle className="graph-node-hit" cx={p.x} cy={p.y} r={HIT_RADIUS} />
                      <circle className="graph-node-focus" cx={p.x} cy={p.y} r={NODE_RADIUS + 5} />
                      <circle className="graph-node-shape" cx={p.x} cy={p.y} r={NODE_RADIUS - 1} />
                      <circle className="graph-node-dot" cx={p.x} cy={p.y} r={3.5} />
                    </a>
                    {/* The label hangs under the station, left-aligned with the station's left edge. */}
                    <text
                      className="graph-label"
                      x={p.x - LABEL_LEFT}
                      y={p.y + LABEL_BASELINE}
                      fontSize={LABEL_SIZE * labelScale}
                      data-faded={faded}
                      aria-hidden="true"
                    >
                      {n.title}
                    </text>
                  </g>
                );
              })}
            </>
          )}
        </svg>

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
      {/* The key sits along the bottom edge of the chart, inside its frame. */}
      <StateLegend />
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
