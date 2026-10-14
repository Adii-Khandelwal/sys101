"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/navItems";

/** The content pages, always one tap away: inline from 900px, behind a Menu button below that. Both render from the same list; CSS shows one. */
export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // A page change, Escape or a press outside closes the menu.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    // The menu is drawn at the end of the body (see below), so move focus into it: Tab would otherwise cross the whole page first.
    menuRef.current?.querySelector("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && !menuRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const links = (
    <>
      {NAV_ITEMS.map((i) => (
        <li key={i.href}>
          <Link href={i.href} aria-current={pathname === i.href ? "page" : undefined}>
            {i.label}
          </Link>
        </li>
      ))}
    </>
  );
  return (
    <nav ref={ref} className="site-nav" aria-label="Explore" data-tour="nav">
      <ul className="site-nav-inline">{links}</ul>
      <button ref={buttonRef} type="button" className="site-nav-button" aria-expanded={open} aria-controls="site-nav-menu" onClick={() => setOpen(!open)}>
        Menu
      </button>
      {/* In the body, not the header: the homepage's flying letters sit above the header (z-index 40) and would show through the panel. */}
      {open &&
        createPortal(
          <ul ref={menuRef} id="site-nav-menu" className="site-nav-menu">
            {links}
          </ul>,
          document.body,
        )}
    </nav>
  );
}
