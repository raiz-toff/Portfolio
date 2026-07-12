/**
 * Ported from ncdai/chanhdai.com (MIT), which credits Devouring Details and
 * Skiper UI. Two departures from the original:
 *
 * - The original springs the line width with motion/react; this project ships
 *   no animation library, so the 24px -> 40px travel is a CSS transition (the
 *   source spring is ~critically damped, so ease-out tracks it closely).
 * - `intensities` is new: instead of one binary active line, each line can be
 *   lit continuously (0..1) to mirror how much of the viewport its section
 *   currently occupies. `activeHref` alone still gives the original behaviour.
 */

"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

export type LineNavItem = {
  title: string;
  href: string;
};

export type LineNavProps = {
  className?: string;
  items: LineNavItem[];
  /** Href of the active item. */
  activeHref?: string;
  /** Per-href lit amount, 0..1. Overrides the binary `activeHref` styling. */
  intensities?: Record<string, number>;
  /** Keep the active item in view when the nav itself is scrollable. */
  scrollActiveIntoView?: boolean;
  onItemClick?: (
    item: LineNavItem,
    event: React.MouseEvent<HTMLAnchorElement>
  ) => void;
} & Omit<React.ComponentProps<"nav">, "onClick">;

export function LineNav({
  className,
  items,
  activeHref,
  intensities,
  scrollActiveIntoView = true,
  onItemClick,
  ...props
}: LineNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const activeItemRef = useRef<HTMLAnchorElement | null>(null);

  const revealActive = useCallback(() => {
    const nav = navRef.current;
    const active = activeItemRef.current;
    if (!scrollActiveIntoView || !nav || !active) return;

    // Only ever scroll the nav's own overflow box. `scrollIntoView` would walk
    // up to the document and yank the page out from under the reader.
    if (nav.scrollHeight <= nav.clientHeight) return;

    nav.scrollTo({
      top: active.offsetTop - (nav.clientHeight - active.offsetHeight) / 2,
      behavior: "smooth",
    });
  }, [scrollActiveIntoView]);

  useEffect(() => {
    revealActive();
  }, [revealActive, activeHref]);

  return (
    <nav
      ref={navRef}
      className={cn("flex flex-col gap-2 py-5.25", className)}
      {...props}
    >
      {items.map((item, index) => {
        const isActive = item.href === activeHref;

        return (
          <LineNavEntry
            key={item.href}
            ref={isActive ? activeItemRef : undefined}
            title={item.title}
            href={item.href}
            active={isActive}
            intensity={intensities?.[item.href] ?? (isActive ? 1 : 0)}
            isLast={index === items.length - 1}
            onClick={
              onItemClick ? (event) => onItemClick(item, event) : undefined
            }
          />
        );
      })}
    </nav>
  );
}

const LineNavEntry = memo(function LineNavEntry({
  ref,
  title,
  href,
  active = false,
  intensity,
  isLast = false,
  onClick,
}: {
  ref?: React.Ref<HTMLAnchorElement>;
  title: string;
  href: string;
  active?: boolean;
  intensity: number;
  isLast?: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <>
      {/* The entry is itself a hairline; ::after re-inflates it into a 28px
          click/focus target that the 1px box would otherwise not provide.
          --line-t drives width and colour; hover forces it to full, which needs
          !important to outrank the inline style. */}
      <a
        ref={ref}
        href={href}
        aria-current={active ? "page" : undefined}
        onClick={onClick}
        style={{ "--line-t": intensity } as React.CSSProperties}
        className={cn(
          "group relative flex h-px items-center gap-3 outline-none",
          "hover:[--line-t:1]!",
          "after:absolute after:top-1/2 after:left-0 after:size-full after:-translate-y-1/2 after:rounded-md after:p-3.5",
          "focus-visible:after:outline-2 focus-visible:after:outline-foreground"
        )}
      >
        <span
          className={cn(
            "block h-px shrink-0 bg-foreground",
            "w-[calc(1.5rem+1rem*var(--line-t))] opacity-[calc(0.2+0.8*var(--line-t))]",
            "transition-[width,opacity] duration-200 ease-out motion-reduce:transition-none"
          )}
        />

        <span
          className={cn(
            "text-sm whitespace-nowrap",
            "text-[color-mix(in_oklab,var(--foreground)_calc(var(--line-t)*100%),var(--muted-foreground))]",
            "transition-[color] duration-200 ease-out motion-reduce:transition-none"
          )}
        >
          {title}
        </span>
      </a>

      {/* Filler hairlines set the vertical rhythm between entries. */}
      {!isLast && (
        <>
          <span className="block h-px w-6 bg-foreground/20" aria-hidden />
          <span className="block h-px w-6 bg-foreground/20" aria-hidden />
        </>
      )}
    </>
  );
});
