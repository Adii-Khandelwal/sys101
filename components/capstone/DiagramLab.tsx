"use client";

import { useState } from "react";
import type { Capstone, NodeState } from "@/lib/capstones";
import { TOUCHED } from "@/lib/capstoneRail";
import { useStoredChoices } from "./useStoredChoices";
import Overprint from "@/components/Overprint";
import BreakIt from "./BreakIt";
import SystemDiagram from "./SystemDiagram";

const RANK: Record<NodeState, number> = { ok: 0, degraded: 1, down: 2 };

/** The system drawing and the failure switches share state, so they live in one island that renders both sections. */
export default function DiagramLab({ slug, diagram, topicTitles }: { slug: string; diagram: Capstone["diagram"]; topicTitles: Record<string, string> }) {
  const [picks, setPick] = useStoredChoices(slug);
  const [selected, setSelected] = useState<string | null>(null);
  const [active, setActive] = useState<string[]>([]);

  const states: Record<string, NodeState> = {};
  for (const f of diagram.failures.filter((x) => active.includes(x.id))) {
    for (const e of f.effects) if (RANK[e.state] > RANK[states[e.nodeId] ?? "ok"]) states[e.nodeId] = e.state;
  }

  return (
    <>
      <section className="cap-section" id="system">
        <Overprint as="h2">The system</Overprint>
        <p className="cap-outcome">After this you can say what each part is for, which company built it that way and what it costs.</p>
        <SystemDiagram title={diagram.title} nodes={diagram.nodes} states={states} selected={selected} onSelect={setSelected} topicTitles={topicTitles} />
      </section>
      <section className="cap-section" id="break">
        <Overprint as="h2">Break it</Overprint>
        <p className="cap-outcome">After this you can predict which parts fail together and which only slow down.</p>
        <BreakIt
          failures={diagram.failures}
          nodes={diagram.nodes}
          active={active}
          states={states}
          onToggle={(id) => {
            if (picks[TOUCHED.break] !== 1) setPick(TOUCHED.break, 1);
            setActive((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
          }}
          onReset={() => setActive([])}
        />
      </section>
    </>
  );
}
