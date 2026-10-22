"use client";

import dynamic from "next/dynamic";

// A real async chunk, fetched only by a topic page that has a step-through; imported from a server component it would sit in the shared topic-page chunk.
export const StepThroughLazy = dynamic(() => import("./StepThrough"));
