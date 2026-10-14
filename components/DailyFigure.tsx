"use client";

import CompanyLogo from "./CompanyLogo";
import { useEffect, useState } from "react";
import type { Figure } from "@/lib/lessonOutline";

/** Whole local days since the epoch, so the figure changes at the reader's midnight. */
const today = () => {
  const d = new Date();
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
};

/**
 * One real figure from a post, changing each day. The page is static, so every figure is in the
 * HTML and the first shows without JavaScript; after load, the day picks which one is shown.
 */
export default function DailyFigure({ figures }: { figures: Figure[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(today() % figures.length), [figures.length]);
  const f = figures[index];

  return (
    <div className="inside-figure">
      <p className="inside-kicker label">A real figure from a post, new each day</p>
      <p className="inside-value">{f.value}</p>
      <p className="inside-meaning">
        {f.meaning}.
        <span className="inside-source label">
          <span className="company-label company-label-inline">
            <CompanyLogo name={f.company} size="sm" />
            <span>
              {f.company}, {f.year}
            </span>
          </span>
          <span aria-hidden="true"> · </span>
          <a href={f.url} target="_blank" rel="noopener noreferrer">
            {f.postTitle}
          </a>
        </span>
      </p>
    </div>
  );
}
