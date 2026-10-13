"use client";

import { useState, type ComponentProps } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PHONE } from "@/lib/breakpoints";

/**
 * A Link that prefetches its page on pointer-enter, focus or touchstart instead of when it scrolls into view.
 * On phones (under 768px) it keeps Next's viewport prefetch: few links are on screen, and a cold tap on a slow
 * connection waits about a second. The check runs once, on the client; prefetch is not part of the markup.
 */
export default function IntentLink({ href, onPointerEnter, onFocus, onTouchStart, ...rest }: ComponentProps<typeof Link>) {
  const router = useRouter();
  const [phone] = useState(() => typeof window !== "undefined" && window.matchMedia(PHONE).matches);
  const warm = () => {
    if (!phone && typeof href === "string") router.prefetch(href);
  };
  return (
    <Link
      href={href}
      prefetch={phone ? undefined : false}
      onPointerEnter={(e) => (warm(), onPointerEnter?.(e))}
      onFocus={(e) => (warm(), onFocus?.(e))}
      onTouchStart={(e) => (warm(), onTouchStart?.(e))}
      {...rest}
    />
  );
}
