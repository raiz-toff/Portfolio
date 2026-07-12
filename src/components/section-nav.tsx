"use client";

import { useEffect, useState } from "react";
import { LineNav, type LineNavItem } from "./line-nav";

// Hrefs must match the `id`s rendered by the homepage panels. "#top" is the page
// wrapper, so the first region covers everything above About (profile header,
// overview, socials, contributions).
const SECTIONS: LineNavItem[] = [
  { title: "Intro", href: "#top" },
  { title: "About", href: "#about" },
  { title: "Stack", href: "#stack" },
  { title: "Experience", href: "#experience" },
  { title: "Certs", href: "#certs" },
  { title: "Lab Log", href: "#lab-log" },
  { title: "Projects", href: "#projects" },
];

const LAST = SECTIONS.length - 1;

// The sticky header covers the top of the viewport, so it isn't really "read".
const HEADER_HEIGHT = 56; // --header-height: 3.5rem

type NavState = {
  activeHref: string;
  intensities: Record<string, number>;
};

/**
 * Treat the page as contiguous regions — each section runs until the next one
 * begins — and measure how much of the reading window each region fills.
 * Intensities are scaled so the dominant region reads as 1, which keeps one
 * line fully lit while its neighbours fade in and out as they enter and leave.
 */
function readViewport(): NavState {
  const scrollY = window.scrollY;
  const windowTop = scrollY + HEADER_HEIGHT;
  const windowBottom = scrollY + window.innerHeight;

  // Region boundaries in document space: [0, top(#about), ..., page bottom].
  const bounds: number[] = [0];
  for (let i = 1; i <= LAST; i++) {
    const el = document.getElementById(SECTIONS[i].href.slice(1));
    const top = el ? el.getBoundingClientRect().top + scrollY : bounds[i - 1];
    // Guard against a missing/reordered section producing a negative region.
    bounds.push(Math.max(top, bounds[i - 1]));
  }
  bounds.push(Math.max(document.documentElement.scrollHeight, bounds[LAST]));

  const visible = SECTIONS.map((_, i) =>
    Math.max(
      0,
      Math.min(bounds[i + 1], windowBottom) - Math.max(bounds[i], windowTop)
    )
  );

  const peak = Math.max(...visible);
  const intensities: Record<string, number> = {};
  let activeHref = SECTIONS[0].href;
  let best = 0;

  SECTIONS.forEach(({ href }, i) => {
    // Rounded so imperceptible scroll jitter doesn't churn React renders.
    intensities[href] =
      peak > 0 ? Math.round((visible[i] / peak) * 100) / 100 : 0;

    // Strict `>` keeps the upper section on a tie, and leaves the first section
    // active in the degenerate case where nothing measures as visible.
    if (visible[i] > best) {
      best = visible[i];
      activeHref = href;
    }
  });

  return { activeHref, intensities };
}

function sameState(a: NavState, b: NavState) {
  return (
    a.activeHref === b.activeHref &&
    SECTIONS.every(
      ({ href }) => a.intensities[href] === b.intensities[href]
    )
  );
}

export default function SectionNav() {
  const [state, setState] = useState<NavState>({
    activeHref: SECTIONS[0].href,
    intensities: { [SECTIONS[0].href]: 1 },
  });

  useEffect(() => {
    let frame = 0;

    const sync = () => {
      frame = 0;
      const next = readViewport();
      setState((prev) => (sameState(prev, next) ? prev : next));
    };

    const onScroll = () => {
      frame ||= requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    // Full-width layer whose inner box mirrors the content column, so the rail
    // hangs off its left edge no matter how wide the viewport gets.
    <div className="pointer-events-none fixed inset-y-0 left-0 z-40 hidden w-full xl:block">
      <div className="relative mx-auto h-full max-w-3xl">
        <LineNav
          aria-label="Page sections"
          items={SECTIONS}
          activeHref={state.activeHref}
          intensities={state.intensities}
          scrollActiveIntoView={false}
          className="pointer-events-auto absolute top-1/2 right-full mr-8 w-48 -translate-y-1/2"
        />
      </div>
    </div>
  );
}
