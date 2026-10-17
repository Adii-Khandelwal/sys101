"use client";

import CompanyLogo from "@/components/CompanyLogo";
import type { Capstone } from "@/lib/capstones";
import { useStoredChoices } from "./useStoredChoices";

type Props = { slug: string; decisions: Capstone["decisions"]; sources: Capstone["sources"] };

/** Pick an answer for each decision first; only then does the company's real choice appear. Picks are remembered in localStorage. */
export default function DesignItFirst({ slug, decisions, sources }: Props) {
  const [picks, setPick] = useStoredChoices(slug);
  return (
    <div className="cap-decisions">
      {decisions.map((d, n) => {
        const picked = Number.isInteger(picks[d.id]) && picks[d.id] >= 0 && picks[d.id] < d.options.length ? picks[d.id] : null;
        const source = sources.find((s) => s.id === d.realChoice.sourceId);
        return (
          <fieldset key={d.id} className="cap-decision">
            <legend>
              <span className="label">
                Decision {n + 1}
              </span>
              <span className="cap-question">{d.question}</span>
            </legend>
            <ul className="cap-options">
              {d.options.map((o, i) => (
                <li key={o.label}>
                  <button type="button" className="cap-option" aria-pressed={picked === i} onClick={() => setPick(d.id, i)}>
                    <span className="cap-mark" aria-hidden="true" />
                    <span>{o.label}</span>
                    {picked !== null && (
                      <span className="label cap-tag">
                        {[picked === i ? "Your pick" : "", d.answerIndex === i ? "Better fit" : ""].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </button>
                  {picked !== null && <p className="cap-why">{o.why}</p>}
                </li>
              ))}
            </ul>
            <div aria-live="polite">
              {picked !== null && (
                <div className="cap-reveal">
                  <p className="label">{picked === d.answerIndex ? "You chose the better fit" : "The better fit was another option"}</p>
                  <p className="cap-real">
                    <CompanyLogo name={d.realChoice.company} size="sm" />
                    <span>
                      <strong>{d.realChoice.company}</strong> chose: {d.realChoice.text}
                      {source && (
                        <>
                          {" "}
                          <a href={source.url} target="_blank" rel="noopener noreferrer">
                            {source.title}
                          </a>
                        </>
                      )}
                    </span>
                  </p>
                  <button type="button" className="cap-link label" onClick={() => setPick(d.id, null)}>
                    Change my answer
                  </button>
                </div>
              )}
            </div>
          </fieldset>
        );
      })}
      <noscript>
        <div className="cap-noscript">
          <p className="label">Answers (shown because scripts are off)</p>
          {decisions.map((d) => (
            <p key={d.id}>
              {d.question} Better fit: {d.options[d.answerIndex].label}. {d.options[d.answerIndex].why} {d.realChoice.company} chose: {d.realChoice.text}
            </p>
          ))}
        </div>
      </noscript>
    </div>
  );
}
