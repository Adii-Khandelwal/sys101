import { ROADMAP_GROUPS, type PlannedTopic } from "@/lib/roadmap";

type Props = { planned: PlannedTopic[]; firstNumber: number };

/** Planned topics from content/roadmap.json, numbered on from the written ones. Not links. */
export default function StillToCome({ planned, firstNumber }: Props) {
  const numbered = planned.map((p, i) => ({ ...p, number: String(firstNumber + i).padStart(2, "0") }));
  const groups = ROADMAP_GROUPS.map((name) => ({ name, entries: numbered.filter((p) => p.group === name) })).filter(
    (g) => g.entries.length > 0,
  );

  return (
    <section className="home-extra index planned" aria-labelledby="planned-heading">
      <h2 id="planned-heading" className="label">
        Still to come
      </h2>
      <p className="home-extra-note">Planned, not written yet. No dates.</p>
      <div className="index-groups">
        {groups.map((g) => (
          <div key={g.name}>
            <h3 className="label">{g.name}</h3>
            <ol>
              {g.entries.map((e) => (
                <li key={e.title}>
                  <span className="index-number">{e.number}</span>
                  <span>{e.title}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
