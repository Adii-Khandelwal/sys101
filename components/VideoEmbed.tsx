"use client";

import { useState } from "react";
import type { VideoSource } from "@/lib/learn";

/** Pull the YouTube video id from a watch, youtu.be, or embed URL. */
function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const m = u.pathname.match(/\/(embed|v)\/([\w-]+)/);
    return m ? m[2] : null;
  } catch {
    return null;
  }
}

/**
 * Click-to-load YouTube embed (CLAUDE.md: nothing from YouTube until "Play
 * here"). Until the reader presses play, this is only text and a button, and
 * no request reaches YouTube. On play it loads the privacy-friendly
 * youtube-nocookie.com player. The external link is always the fallback, and
 * works without JavaScript. See the Privacy page.
 */
export default function VideoEmbed({ video }: { video: VideoSource }) {
  const [playing, setPlaying] = useState(false);
  const id = youtubeId(video.url);

  const meta = (
    <span className="learn-video-meta">
      {" "}
      {video.channel}, {video.year}, {video.length}. Not reviewed by the author.
    </span>
  );

  // No parseable id, or no JS: fall back to the plain link, exactly as before.
  if (!id) {
    return (
      <p className="learn-video">
        <span className="label">Video, optional and long</span>{" "}
        <a href={video.url} target="_blank" rel="noopener noreferrer">
          {video.title}
        </a>
        {meta} Opens on YouTube.
      </p>
    );
  }

  if (playing) {
    return (
      <figure className="learn-video is-playing">
        <div className="video-frame">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
        <figcaption className="learn-video-meta">
          <a href={video.url} target="_blank" rel="noopener noreferrer">
            {video.title}
          </a>
          {meta}
        </figcaption>
      </figure>
    );
  }

  return (
    <div className="learn-video">
      <span className="label">Video, optional and long</span>{" "}
      <button type="button" className="text-button video-play" onClick={() => setPlaying(true)}>
        Play here: {video.title}
      </button>
      {meta}{" "}
      <span className="video-note">
        Nothing loads from YouTube until you press play.{" "}
        <a href={video.url} target="_blank" rel="noopener noreferrer">
          Open on YouTube instead
        </a>
        .
      </span>
    </div>
  );
}
