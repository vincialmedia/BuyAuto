"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal disclosure-style dropdown for the site header.
 *
 * Replaces Radix DropdownMenu there on purpose:
 * - Radix menu + its positioning engine (floating-ui, roving focus,
 *   remove-scroll) added ~15 KB gz to _app for two static header menus that
 *   never need collision-aware positioning.
 * - Radix renders menu content only while open, so the nav links inside were
 *   invisible to crawlers in the initial HTML. This panel is always in the
 *   DOM (server-rendered) and merely toggled with CSS — the links are part of
 *   every page's HTML now.
 *
 * Follows the WAI-ARIA disclosure-navigation pattern (aria-expanded on the
 * trigger) rather than role="menu": these are plain links/actions, not an
 * application menu. Closed state uses visibility:hidden, so items are neither
 * focusable nor announced until opened.
 */
interface HeaderDropdownProps {
  /** Trigger content (icon + label). Rendered inside the toggle button. */
  trigger: ReactNode;
  triggerClassName?: string;
  /** Horizontal alignment of the panel relative to the trigger. */
  align?: "center" | "end";
  panelClassName?: string;
  children: ReactNode;
}

export function HeaderDropdown({
  trigger,
  triggerClassName,
  align = "center",
  panelClassName,
  children,
}: HeaderDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={triggerClassName}
      >
        {trigger}
      </button>

      <div
        // Selecting any link or button inside closes the panel; the event
        // still bubbles so Link navigation proceeds normally.
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a, button")) setOpen(false);
        }}
        className={cn(
          "absolute top-full z-50 mt-2 min-w-[14rem] rounded-md border border-neutral-200 bg-white p-1 shadow-md",
          "transition-[opacity,transform] duration-150",
          align === "center" ? "left-1/2 -translate-x-1/2" : "right-0",
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-1 opacity-0 pointer-events-none",
          panelClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Item styling that matches the previous Radix menu look. */
export const headerDropdownItemClass =
  "flex w-full cursor-pointer items-center rounded-sm px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900";

export function HeaderDropdownSeparator() {
  return <div className="my-1 h-px bg-neutral-100" />;
}
