"use client";

import dynamic from "next/dynamic";

// Real async chunks, fetched only by a page that renders the figure. Imported from a server
// component the code would sit in the shared topic-page chunk and every topic would download it.
export const SlidingWindowLazy = dynamic(() => import("./SlidingWindowLive"));
export const FillRaceLazy = dynamic(() => import("./FillRaceLive"));
export const CommitLatchLazy = dynamic(() => import("./CommitLatchLive"));
export const XidDialLazy = dynamic(() => import("./XidDialLive"));
export const HashRingLazy = dynamic(() => import("./HashRingLive"));
export const RetryJitterLazy = dynamic(() => import("./RetryJitterLive"));
export const FilterBitsLazy = dynamic(() => import("./FilterBitsLive"));
export const BreakerGateLazy = dynamic(() => import("./BreakerGateLive"));
export const TokenBucketLazy = dynamic(() => import("./TokenBucketLive"));
