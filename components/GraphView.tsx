"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type Sigma from "sigma";
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
 * Lay the prerequisite DAG out left to right: a node's column is the length
 * of the longest prerequisite chain leading to it, so foundations sit on the
 * left and the things built on them fan out to the right.
 */
function layout(nodes: GraphNode[], edges: GraphEdge[]) {
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
      positions.set(slug, { x: d, y: i - (slugs.length - 1) / 2 });
    });
  }
  return positions;
}

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
      const [{ default: Graph }, { default: SigmaCtor }] = await Promise.all([
        import("graphology"),
        import("sigma"),
        document.fonts.ready,
      ]);
      if (cancelled || !container.current) return;

      const serif = getComputedStyle(document.body).fontFamily;
      const positions = layout(nodes, edges);
      const graph = new Graph({ type: "directed" });

      for (const n of nodes) {
        const { x, y } = positions.get(n.slug)!;
        graph.addNode(n.slug, {
          x,
          y,
          label: n.title,
          size: 9 + Math.min(n.posts, 6) * 1.5,
          color: INK,
        });
      }
      for (const e of edges) {
        if (graph.hasNode(e.from) && graph.hasNode(e.to)) {
          graph.addEdge(e.from, e.to, { color: INK_SOFT, size: 1.5 });
        }
      }

      renderer = new SigmaCtor(graph, container.current, {
        defaultEdgeType: "arrow",
        labelFont: serif,
        labelSize: 20,
        labelWeight: "500",
        labelColor: { color: INK },
        labelRenderedSizeThreshold: 0,
        stagePadding: 120,
        // Labels sit centred below each node so left-to-right edges never cross them.
        defaultDrawNodeLabel: (ctx, data, settings) => {
          if (!data.label) return;
          ctx.font = `${settings.labelWeight} ${settings.labelSize}px ${settings.labelFont}`;
          ctx.fillStyle = INK;
          ctx.textAlign = "center";
          ctx.fillText(data.label, data.x, data.y + data.size + settings.labelSize + 4);
          ctx.textAlign = "left";
        },
        // Sigma's default hover draws a white box with a drop shadow; replace it
        // with the label in accent ink on a flat paper ground.
        defaultDrawNodeHover: (ctx, data, settings) => {
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
          ctx.beginPath();
          ctx.arc(data.x, data.y, data.size, 0, Math.PI * 2);
          ctx.fill();
        },
      });

      rendererRef.current = renderer;
      setReady(true);
      renderer.on("clickNode", ({ node }) => router.push(`/topic/${node}`));
      renderer.on("enterNode", () => {
        container.current!.style.cursor = "pointer";
      });
      renderer.on("leaveNode", () => {
        container.current!.style.cursor = "default";
      });
    })();

    return () => {
      cancelled = true;
      renderer?.kill();
      rendererRef.current = null;
      setReady(false);
    };
  }, [nodes, edges, router]);

  // Read topics are filled in the accent colour.
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!ready || !renderer) return;
    renderer.getGraph().forEachNode((slug) => {
      renderer.getGraph().setNodeAttribute(slug, "color", read.includes(slug) ? ACCENT : INK);
    });
  }, [ready, read]);

  return (
    <div className="graph">
      {!ready && <GraphSkeleton />}
      <div ref={container} className="graph-canvas" aria-label="Topic prerequisite graph" />
    </div>
  );
}

/** Placeholder shown while Sigma and the fonts load: muted nodes, edges and label bars. */
function GraphSkeleton() {
  return (
    <div className="graph-skeleton" aria-hidden="true">
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
