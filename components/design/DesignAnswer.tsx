import Link from "next/link";
import type { ReactNode } from "react";
import type { Design, DesignBlock } from "@/lib/design";
import { STEPS } from "@/lib/designSteps";
import { diagramHtml } from "@/lib/diagramHtml";
import { Cites } from "./DesignCites";
import DesignRoundBox from "./DesignRound";
import DesignTurn from "./DesignTurn";

type Titles = Record<string, string>;

function Topics({ slugs, titles }: { slugs: string[]; titles: Titles }) {
  if (!slugs.length) return null;
  return (
    <p className="label design-badge">
      <span>Leans on</span>
      {slugs.map((t) => (
        <Link key={t} href={`/topic/${t}`}>
          {titles[t] ?? t}
        </Link>
      ))}
    </p>
  );
}

const Figure = ({ title, svg }: { title?: string; svg: string }) => (
  <>
    {title && <p className="fig-label label">{title}</p>}
    <figure className="diagram" dangerouslySetInnerHTML={{ __html: diagramHtml(svg) }} />
  </>
);

/** The round, section by section: the round box (ask, say, tip), then the reasoning in the order written. */
function Real({ text, cites, sources }: { text: string; cites: string[]; sources: Design["sources"] }) {
  return (
    <div className="design-block design-real">
      <p className="label design-tag">
        <span className="design-shape" aria-hidden="true" />
        How a real system does it
      </p>
      <p>{text}</p>
      <Cites ids={cites} sources={sources} />
    </div>
  );
}

export default function DesignAnswer({ d, topicTitles }: { d: Design; topicTitles: Titles }) {
  const sources = d.sources;
  const block = (b: DesignBlock, i: number): ReactNode => {
    switch (b.type) {
      case "p":
        return (
          <div key={i} className="design-block">
            <p>{b.text}</p>
            <Cites ids={b.cites} sources={sources} />
          </div>
        );
      case "list":
        return (
          <div key={i} className="design-block">
            <ul className="design-list">
              {b.items.map((x, j) => (
                <li key={j}>{x}</li>
              ))}
            </ul>
            <Cites ids={b.cites} sources={sources} />
          </div>
        );
      case "assumption":
        return (
          <div key={i} className="design-block design-assumption">
            <p className="label design-tag">
              <span className="design-shape" aria-hidden="true" />
              Assumption for this exercise
            </p>
            <p>{b.text}</p>
          </div>
        );
      case "real":
        return <Real key={i} text={b.text} cites={b.cites} sources={sources} />;
      case "diagram":
        return <Figure key={i} title={b.title} svg={b.svg} />;
      case "table":
        return (
          <div key={i} className="design-table" role="region" aria-label={b.caption} tabIndex={0}>
            <table>
              <caption>{b.caption}</caption>
              <thead>
                <tr>
                  {b.columns.map((c, j) => (
                    <th key={j} scope="col">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, j) => (
                  <tr key={j}>
                    {r.map((c, k) => (
                      <td key={k}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  };
  const blocks = (list?: DesignBlock[]) => (list ?? []).map(block);
  const labelled = (label: string, text: string) => (
    <div className="design-part">
      <p className="label">{label}</p>
      <p>{text}</p>
    </div>
  );

  const body = (id: (typeof STEPS)[number]["id"]): ReactNode => {
    if (id === "high-level") {
      const s = d["high-level"];
      return (
        <>
          {blocks(s.blocks)}
          <ol className="design-stages">
            {s.stages.map((st, n) => (
              <li key={st.id}>
                <h4>
                  <span className="label">Stage {n + 1}</span>
                  <span>{st.need}</span>
                </h4>
                {labelled("What we add", st.add)}
                {labelled("Still weak", st.weak)}
                {st.diagram && <Figure svg={st.diagram} />}
              </li>
            ))}
          </ol>
          <Topics slugs={s.topics} titles={topicTitles} />
        </>
      );
    }
    if (id === "deep-dives") {
      const s = d["deep-dives"];
      return (
        <>
          {blocks(s.blocks)}
          <ol className="design-stages">
            {s.dives.map((dv, n) => (
              <li key={dv.id}>
                <h4>
                  <span className="label">Dive {n + 1}</span>
                  <span>{dv.title}</span>
                </h4>
                {labelled("First attempt", dv.attempt)}
                {labelled("What breaks", dv.breaks)}
                {labelled("A better design", dv.better)}
                {labelled("The trade-off", dv.tradeoff)}
                <Cites ids={dv.cites} sources={sources} />
                {dv.real && <Real text={dv.real.text} cites={dv.real.cites} sources={sources} />}
              </li>
            ))}
          </ol>
          {s.notes && s.notes.length > 0 && (
            <>
              <p className="label">Shorter notes</p>
              <ul className="design-list">
                {s.notes.map((x, j) => (
                  <li key={j}>{x}</li>
                ))}
              </ul>
            </>
          )}
          <Topics slugs={s.topics} titles={topicTitles} />
        </>
      );
    }
    if (id === "strong-answer") {
      const s = d["strong-answer"];
      return (
        <>
          {labelled("The 60-second talk track", s.talkTrack)}
          {labelled("A mid-level pass", s.levels.mid)}
          {labelled("A senior pass", s.levels.senior)}
          {labelled("A staff pass", s.levels.staff)}
          <p className="label">If the interviewer says</p>
          <ol className="design-followups">
            {s.followUps.map((f, j) => (
              <li key={j}>
                <DesignTurn who="Interviewer">
                  <p>{f.ask}</p>
                </DesignTurn>
                <DesignTurn who="You">
                  <p>{f.answer}</p>
                  <Cites ids={f.cites} sources={sources} />
                </DesignTurn>
              </li>
            ))}
          </ol>
          <Topics slugs={s.topics} titles={topicTitles} />
        </>
      );
    }
    if (id === "mistakes") {
      const s = d.mistakes;
      return (
        <>
          <ul className="design-list">
            {s.items.map((m, j) => (
              <li key={j} className="design-mistake">
                <strong>{m.mistake}</strong>
                <span>{m.fix}</span>
              </li>
            ))}
          </ul>
          <Topics slugs={s.topics} titles={topicTitles} />
        </>
      );
    }
    const s = d[id];
    return (
      <>
        {blocks(s.blocks)}
        <Topics slugs={s.topics ?? []} titles={topicTitles} />
      </>
    );
  };

  return (
    <ol className="design-answer">
      {STEPS.map((s, n) => (
        <li key={s.id} id={s.id}>
          <h3>
            <span className="label">Section {n + 1}</span>
            <span>{s.label}</span>
          </h3>
          {s.id !== "general-tips" && (
            <>
              <DesignRoundBox round={d[s.id]} />
              <h4 className="design-reasoning">The reasoning behind it</h4>
            </>
          )}
          {body(s.id)}
        </li>
      ))}
    </ol>
  );
}
