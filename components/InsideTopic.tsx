import { topicSections, type Figure } from "@/lib/lessonOutline";
import Overprint from "./Overprint";
import DailyFigure from "./DailyFigure";
import type { Topic } from "@/lib/topics";

/** What every topic page holds, built from a topic's data, with a figure of the day from the posts. */
export default function InsideTopic({ topic, figures }: { topic: Topic; figures: Figure[] }) {
  const sections = topicSections(topic);
  return (
    <section className="home-extra inside-topic" aria-labelledby="inside-heading">
      <Overprint id="inside-heading" className="label">Inside a topic</Overprint>
      <p className="home-extra-note">What every topic page holds.</p>
      <ol className="inside-sequence">
        {sections.map((s, i) => (
          <li key={s.id}>
            <span className="index-number">{String(i + 1).padStart(2, "0")}</span>
            <span className="inside-name">{s.name}</span>
            <span className="inside-count">{s.count ?? "\u00a0"}</span>
          </li>
        ))}
      </ol>
      <DailyFigure figures={figures} />
    </section>
  );
}
