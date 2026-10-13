"use client";

import dynamic from "next/dynamic";

// Real async chunks, fetched only by a page that renders the figure. Imported from a server
// component the code would sit in the shared topic-page chunk and every topic would download it.
export const SlidingWindowLazy = dynamic(() => import("./SlidingWindowLive"));
export const FillRaceLazy = dynamic(() => import("./FillRaceLive"));
export const CommitLatchLazy = dynamic(() => import("./CommitLatchLive"));
