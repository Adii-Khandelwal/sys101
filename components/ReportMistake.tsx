"use client";

import { usePathname } from "next/navigation";
import { REPORT_EMAIL, absoluteUrl } from "@/lib/site";

/** Mail link whose subject carries the page the reader is on. */
export default function ReportMistake() {
  const subject = encodeURIComponent(`Mistake on ${absoluteUrl(usePathname() || "/")}`);
  return <a href={`mailto:${REPORT_EMAIL}?subject=${subject}`}>Report a mistake</a>;
}
