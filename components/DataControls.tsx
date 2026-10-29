"use client";

import Overprint from "./Overprint";
import { useEffect, useRef, useState } from "react";
import { inProgressSlugs, replaceProgress, useAllProgress } from "@/lib/progress";
import { clearReadReads } from "@/lib/readsRead";
import { clearCapstoneChoices } from "@/components/capstone/useStoredChoices";
import { forgetSeen, loadSeen } from "@/lib/tourSeen";
import {
  deriveRead,
  exportFile,
  exportName,
  planImport,
  resetAll,
  resetTopic,
  summary,
  MAX_IMPORT_CHARS,
  validateImport,
  type LessonMeta,
  type Progress,
} from "@/lib/lessonStore";

type TopicMeta = LessonMeta & { title: string; prerequisites: string[] };
type Pending = { progress: Progress; read: string[]; updated: Record<string, string>; ignored: number; name: string };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** ISO timestamp -> "11 Oct 2026", in local time. */
const shortDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Export, import and reset for all progress in this browser. Text buttons, in-place confirmations. */
export default function DataControls({ topics }: { topics: TopicMeta[] }) {
  const { status, progress, read, updated } = useAllProgress();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [confirmReset, setConfirmReset] = useState<string | null>(null); // a slug, or "all"
  const file = useRef<HTMLInputElement>(null);
  const [toursSeen, setToursSeen] = useState(false);
  useEffect(() => setToursSeen(Object.keys(loadSeen().seen).length > 0), []);

  const blocked = status === "blocked";
  const corrupt = status === "corrupt";
  const empty = status === "empty";
  const known = { slugs: topics.map((t) => t.slug), postIds: topics.flatMap((t) => t.postIds) };
  // The page is built ahead of time, so today's file name is only known in the browser.
  const [fileName, setFileName] = useState("");
  useEffect(() => setFileName(exportName()), []);

  const doExport = () => {
    const blob = new Blob([JSON.stringify(exportFile(progress, [...read], new Date(), updated), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportName();
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000); // Safari and Firefox read the blob after click() returns
    setMessage(`Exported ${exportName()}.`);
  };

  const choose = async (f: File) => {
    setConfirmReset(null);
    // Refuse a huge file before reading it into memory.
    if (f.size > MAX_IMPORT_CHARS) {
      setPending(null);
      return setMessage("Nothing was imported. That file is too large to be a sys101 progress export.");
    }
    const text = await f.text().catch(() => null);
    if (text === null) {
      setPending(null);
      return setMessage("Nothing was imported. That file could not be read.");
    }
    const r = validateImport(text, known);
    if (!r.ok) {
      setPending(null);
      return setMessage(`Nothing was imported. ${r.error}`);
    }
    setMode(corrupt || empty ? "replace" : "merge");
    setPending({ progress: r.progress, read: r.read, updated: r.updated, ignored: r.ignored, name: f.name });
    setMessage("");
  };

  const plan = (p: Pending, m: "merge" | "replace") => planImport({ progress, read, updated, corrupt }, p, m, topics);

  const apply = () => {
    if (!pending) return;
    const { next, nextRead, dates, diff } = plan(pending, mode);
    replaceProgress(next, nextRead, dates);
    setPending(null);
    setMessage(
      `Imported ${pending.name}: ${plural(diff.topics, "topic")} updated, ${plural(diff.items, "item")} changed.` +
        (pending.ignored ? ` ${plural(pending.ignored, "entry", "entries")} for topics or posts this site doesn't have ${pending.ignored === 1 ? "was" : "were"} ignored.` : ""),
    );
  };

  const reset = (slug: string | "all") => {
    if (slug === "all") {
      const r = resetAll();
      replaceProgress(r.progress, r.read, {});
      clearReadReads();
      clearCapstoneChoices();
      forgetSeen(); // "everything" includes the tour: its links come back
      setToursSeen(false);
      setMessage("All progress in this browser was reset, and the tour links are back.");
    } else {
      const meta = topics.find((t) => t.slug === slug)!;
      const next = resetTopic(progress, meta);
      const { [slug]: _gone, ...dates } = updated;
      replaceProgress(next, deriveRead([...read].filter((s) => s !== slug), next, topics), dates);
      setMessage(`${meta.title} was reset.`);
    }
    setConfirmReset(null);
  };

  const preview = pending ? plan(pending, mode) : null;
  const doneTopics = topics.filter((t) => read.includes(t.slug)).length;
  // Read-only progress tally: read, started-but-unfinished, and ready to start.
  const inProgress = new Set(inProgressSlugs(progress, read));
  const inProgressCount = topics.filter((t) => inProgress.has(t.slug)).length;
  const readyCount = topics.filter(
    (t) => !read.includes(t.slug) && !inProgress.has(t.slug) && t.prerequisites.every((p) => read.includes(p)),
  ).length;
  // Topics with any progress first, most recently changed first; untouched topics keep their order.
  const ordered = topics
    .map((t, i) => ({ t, i, s: summary(progress, t) }))
    .sort(
      (a, b) =>
        Number(b.s.done > 0) - Number(a.s.done > 0) ||
        (updated[b.t.slug] ?? "").localeCompare(updated[a.t.slug] ?? "") ||
        b.s.done - a.s.done ||
        a.i - b.i,
    );

  return (
    <div className="data-page">
      {blocked && (
        <p className="data-alert">
          This browser is blocking site storage (private browsing or a site-data setting), so progress can&apos;t be
          saved, exported or imported here.
        </p>
      )}
      {corrupt && (
        <p className="data-alert">
          The progress saved in this browser is damaged and can&apos;t be read. You can import an export to replace
          it, or reset everything below.
        </p>
      )}
      {empty && <p className="data-note">Nothing has been saved in this browser yet.</p>}

      {!blocked && !corrupt && (
        <section aria-labelledby="summary-h">
          <Overprint as="h2" id="summary-h">Progress</Overprint>
          <p>
            {doneTopics} of {topics.length} topics read
            {inProgressCount > 0 ? `, ${inProgressCount} in progress` : ""}
            {readyCount > 0 ? `, ${readyCount} ready to start` : ""}.
          </p>
          <ul className="data-topics">
            {ordered.map(({ t, s }) => {
              return (
                <li key={t.slug}>
                  <span className="data-topic-title">{t.title}</span>
                  <span className="label">
                    {s.done} of {s.total} done
                    {updated[t.slug] ? `, changed ${shortDate(updated[t.slug])}` : ""}
                  </span>
                  {confirmReset === t.slug ? (
                    <span className="data-confirm" role="group" aria-label={`Reset ${t.title}?`}>
                      <span>Reset {t.title}? Export first if you may want it back.</span>
                      <button type="button" className="text-button label" onClick={() => reset(t.slug)}>
                        Yes, reset
                      </button>
                      <button type="button" className="text-button label" onClick={() => setConfirmReset(null)}>
                        Cancel
                      </button>
                    </span>
                  ) : (
                    (s.done > 0 || updated[t.slug]) && (
                      <button type="button" className="text-button label" onClick={() => setConfirmReset(t.slug)} aria-label={`Reset ${t.title}`}>
                        Reset
                      </button>
                    )
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="export-h">
        <Overprint as="h2" id="export-h">Export and import</Overprint>
        <p>
          An export is a small file{fileName ? `, ${fileName},` : " named with today's date,"} holding everything on
          this page. Import it in another browser to carry your progress over.
        </p>
        <p className="data-actions">
          <button type="button" className="text-button label" onClick={doExport} disabled={blocked || corrupt || empty}>
            Export all progress
          </button>
          <button type="button" className="text-button label" onClick={() => file.current?.click()} disabled={blocked}>
            Import a file
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) choose(f);
              e.target.value = "";
            }}
          />
        </p>

        {pending && preview && (
          <div className="data-preview" role="group" aria-label="Import preview">
            <p>
              {pending.name} updates {plural(preview.diff.topics, "topic")} and changes {plural(preview.diff.items, "item")}.
              {pending.ignored ? ` ${plural(pending.ignored, "entry", "entries")} for topics or posts this site doesn't have will be ignored.` : ""}
            </p>
            <fieldset className="data-mode">
              <legend className="label">How to combine it</legend>
              <label>
                <input type="radio" name="mode" checked={mode === "merge"} onChange={() => setMode("merge")} disabled={corrupt} />{" "}
                Merge: keep what is here and add what the file has
              </label>
              <label>
                <input type="radio" name="mode" checked={mode === "replace"} onChange={() => setMode("replace")} /> Replace:
                use only the file
              </label>
            </fieldset>
            <p className="data-actions">
              <button type="button" className="text-button label" onClick={apply}>
                Apply import
              </button>
              <button type="button" className="text-button label" onClick={() => setPending(null)}>
                Cancel
              </button>
            </p>
          </div>
        )}
      </section>

      <p className="data-note" aria-live="polite">
        {message}
      </p>

      <section aria-labelledby="tours-h">
        <Overprint as="h2" id="tours-h">Guided tours</Overprint>
        {toursSeen ? (
          <>
            <p>You have taken or skipped the guided tour here, so its link is hidden. Show it again on the homepage and on topic pages:</p>
            <p>
              <button
                type="button"
                className="text-button label"
                onClick={() => {
                  forgetSeen();
                  setToursSeen(false);
                }}
              >
                Show the tour links again
              </button>
            </p>
          </>
        ) : (
          <p>The &ldquo;Take the 30-second tour&rdquo; links show on the homepage and on topic pages. The browser keeps only whether you have taken or skipped one.</p>
        )}
      </section>

      <section aria-labelledby="reset-h" className="data-danger">
        <Overprint as="h2" id="reset-h">Reset everything</Overprint>
        <p>Clears every topic&apos;s progress in this browser and brings the tour links back. It can&apos;t be undone, so export first if you may want your progress back.</p>
        {confirmReset === "all" ? (
          <p className="data-confirm" role="group" aria-label="Reset everything?">
            <span>Reset all progress?</span>
            <button type="button" className="text-button label" onClick={() => reset("all")}>
              Yes, reset everything
            </button>
            <button type="button" className="text-button label" onClick={() => setConfirmReset(null)}>
              Cancel
            </button>
          </p>
        ) : (
          <p>
            <button type="button" className="text-button label" disabled={blocked || (empty && !toursSeen)} onClick={() => setConfirmReset("all")}>
              Reset everything
            </button>
          </p>
        )}
      </section>
    </div>
  );
}
