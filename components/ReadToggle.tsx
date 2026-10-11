"use client";

import { useIsRead } from "@/lib/progress";

export default function ReadToggle({ slug }: { slug: string }) {
  const [isRead, toggle] = useIsRead(slug);
  return (
    <button type="button" className="read-toggle label" aria-pressed={isRead} onClick={toggle}>
      <span className="read-box" aria-hidden="true" />
      <span key={isRead ? "read" : "unread"} className="fade-swap">
        {isRead ? "Read" : "Mark as read"}
      </span>
    </button>
  );
}
