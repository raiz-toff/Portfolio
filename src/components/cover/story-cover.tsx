"use client";

// Candidate G — "the whole story".
// All six candidates merged into one interactive cover: five chapters that
// zoom from a data-center floor down to eight copper conductors, then pull
// back for the reveal — none of it is a facility; it's one hypervisor on a
// bench in Toronto.
//
//   01 the floor      (dc-floor: walk it, bfs pathfinding, hud)
//   02 the cold aisle (cold-aisle: pointer parallax, drifting when idle)
//   03 the rack       (crossover-rack: smil staged reveal, replays per visit)
//   04 layer 1        (patch-panel ⇄ dual-patch-panel: near end / far end)
//   05 the bench      (iso-lab: the punchline)
//
// Navigation: hotspot chips on the artwork, a chapter rail, and Escape to
// zoom back out. Transitions speak "camera": going deeper, the old view
// swells past the lens while the new one grows in from behind; going back
// out, the reverse. Each scene remounts on entry (keyed), and its SMIL
// timeline is rewound via setCurrentTime(0) so staged reveals replay.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import ColdAisle from "./cold-aisle";
import CrossoverRack from "./crossover-rack";
import DcFloor from "./dc-floor";
import DualPatchPanel from "./dual-patch-panel";
import IsoLab from "./iso-lab";
import PatchPanel from "./patch-panel";

type SceneId = "floor" | "aisle" | "rack" | "panel" | "farend" | "bench";

// Narrative depth: higher = closer to the copper (bench sits past the panel
// as the "pull all the way back" finale). Drives transition direction.
const DEPTH: Record<SceneId, number> = {
  floor: 0,
  aisle: 1,
  rack: 2,
  panel: 3,
  farend: 3.5,
  bench: 4,
};

// Where Escape (and the ↩ chip) takes you.
const PARENT: Record<SceneId, SceneId | null> = {
  floor: null,
  aisle: "floor",
  rack: "aisle",
  panel: "rack",
  farend: "panel",
  bench: "rack",
};

const BACK_LABEL: Record<SceneId, string> = {
  floor: "",
  aisle: "↩ the floor",
  rack: "↩ the aisle",
  panel: "↩ the rack",
  farend: "↩ the near end",
  bench: "↩ the rack",
};

const FIG: Record<SceneId, string> = {
  floor: "FIG_010 — THE FLOOR",
  aisle: "FIG_011 — THE COLD AISLE",
  rack: "FIG_012 — THE RACK",
  panel: "FIG_013 — LAYER 1",
  farend: "FIG_013B — THE FAR END",
  bench: "FIG_014 — THE BENCH",
};

const CAPTION: Record<SceneId, string> = {
  floor:
    "a facility, from above. cold air down the middle, heat off the backs, three crac units on the north wall. walk to a rack — or step straight in.",
  aisle:
    "standing in the cold aisle. supply air in your face, forty-odd racks breathing link-light. pick one and open it.",
  rack: "inside: t568a up top, t568b below, one dark fiber between them — and a switch that knows the way out. trace the copper, or follow the uplink.",
  panel:
    "layer 1. eight conductors in t568b order, orange-white on pin 1. everything above this line is an abstraction.",
  farend:
    "the far end of the same run: a-standard here, b-standard there. swap the orange and green pairs by hand — that's a crossover.",
  bench:
    "and the reveal: there is no facility. it's a bench in the corner of a room in toronto — pve-01, eve-ng, cml — one hypervisor running the whole dream.",
};

const CHAPTERS: { scene: SceneId; num: string; label: string }[] = [
  { scene: "floor", num: "01", label: "floor" },
  { scene: "aisle", num: "02", label: "aisle" },
  { scene: "rack", num: "03", label: "rack" },
  { scene: "panel", num: "04", label: "layer 1" },
  { scene: "bench", num: "05", label: "bench" },
];

function Chip({
  pos,
  onClick,
  href,
  pulse,
  children,
}: {
  pos: React.CSSProperties;
  onClick?: () => void;
  href?: string;
  pulse?: boolean;
  children: React.ReactNode;
}) {
  const className =
    "pointer-events-auto absolute z-30 flex cursor-pointer select-none items-center gap-1.5 rounded-md border bg-background/95 px-2 py-1 font-mono text-[11px] text-muted-foreground backdrop-blur-sm transition-colors hover:border-ring hover:text-foreground";
  const dot = pulse ? (
    <span
      className="size-1.5 shrink-0 animate-pulse rounded-full bg-led-green motion-reduce:animate-none"
      aria-hidden
    />
  ) : null;
  if (href) {
    return (
      <Link href={href} className={className} style={pos}>
        {dot}
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className} style={pos}>
      {dot}
      {children}
    </button>
  );
}

type SceneState = {
  cur: SceneId;
  curKey: string;
  prev: SceneId | null;
  prevKey: string | null;
  dir: "in" | "out";
  gen: number;
};

// In the compact hero variant the stage is shorter (640/370 vs 640/420), so
// every scene is scaled to fill the stage's height (width-% = scene aspect
// ratio ÷ stage aspect ratio) — taller scenes shrink to stay fully visible,
// shorter ones grow past 100% so they don't float in empty letterboxing.
const HERO_FIT: Partial<Record<SceneId, number>> = {
  floor: 116,
  aisle: 90,
  rack: 93,
  panel: 173,
  farend: 163,
  bench: 163,
};

export default function StoryCover({
  variant = "full",
}: {
  /**
   * "full": stage + FIG label + caption + chapter rail below (the cover lab).
   * "hero": artwork only — tighter stage, no prose, a minimal numbers-only
   * rail overlaid on the art (the homepage figure slot).
   */
  variant?: "full" | "hero";
} = {}) {
  const [scene, setScene] = useState<SceneState>({
    cur: "floor",
    curKey: "floor-0",
    prev: null,
    prevKey: null,
    dir: "in",
    gen: 0,
  });
  const [nearRack, setNearRack] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const curRef = useRef<SceneId>("floor");
  curRef.current = scene.cur;

  const go = useCallback((to: SceneId) => {
    setScene((s) => {
      // navigation is atomic: ignore clicks while a transition is in flight,
      // so a dying scene can never re-route the story and an entering view is
      // never repurposed mid-animation (which would pop its opacity)
      if (to === s.cur || s.prev !== null) return s;
      const gen = s.gen + 1;
      return {
        cur: to,
        curKey: `${to}-${gen}`,
        prev: s.cur,
        prevKey: s.curKey,
        dir: DEPTH[to] > DEPTH[s.cur] ? "in" : "out",
        gen,
      };
    });
  }, []);

  // drop the exiting view once its animation has played out
  useEffect(() => {
    if (!scene.prev) return;
    const gen = scene.gen;
    const t = window.setTimeout(() => {
      setScene((s) =>
        s.gen === gen ? { ...s, prev: null, prevKey: null } : s
      );
    }, 560);
    return () => window.clearTimeout(t);
  }, [scene.gen, scene.prev]);

  // rewind the fresh view's SMIL timeline so its staged reveal replays on
  // every visit (browsers share one timeline per svg; re-entering a scene
  // late would otherwise skip its choreography). Also park keyboard focus on
  // the stage: the chip the user activated has just unmounted, and without
  // this, focus silently drops to <body>.
  useEffect(() => {
    const svgs = stageRef.current?.querySelectorAll<SVGSVGElement>(
      "[data-story-current] svg"
    );
    svgs?.forEach((s) => {
      try {
        s.setCurrentTime(0);
      } catch {
        // older engines without smil clock control — reveal still shows once
      }
    });
    if (scene.gen > 0) {
      stageRef.current?.focus({ preventScroll: true });
    }
  }, [scene.curKey, scene.gen]);

  // escape zooms back out one level — but only while the stage is on screen,
  // so it can't invisibly re-route the story from elsewhere on the page
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let inView = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
      },
      { threshold: 0.25 }
    );
    io.observe(stage);
    function onKey(e: KeyboardEvent) {
      if (!inView || e.key !== "Escape") return;
      const parent = PARENT[curRef.current];
      if (parent) go(parent);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      io.disconnect();
      window.removeEventListener("keydown", onKey);
    };
  }, [go]);

  function art(id: SceneId) {
    const back = PARENT[id] && (
      <Chip pos={{ top: "3%", left: "1.5%" }} onClick={() => go(PARENT[id]!)}>
        {BACK_LABEL[id]}
      </Chip>
    );
    switch (id) {
      case "floor":
        return (
          <>
            <DcFloor onNear={setNearRack} />
            <Chip
              pos={{ right: "2%", bottom: "13%" }}
              onClick={() => go("aisle")}
              pulse
            >
              {nearRack
                ? `step in — beside ${nearRack} ▸`
                : "walk to a rack, or step straight in ▸"}
            </Chip>
          </>
        );
      case "aisle":
        return (
          <>
            <ColdAisle />
            {back}
            <Chip
              pos={{ right: "2.5%", top: "46%" }}
              onClick={() => go("rack")}
              pulse
            >
              open the rack ▸
            </Chip>
          </>
        );
      case "rack":
        return (
          <>
            <CrossoverRack />
            {back}
            <Chip
              pos={{ left: "54%", top: "74%" }}
              onClick={() => go("panel")}
              pulse
            >
              trace layer 1 ▸
            </Chip>
            <Chip pos={{ right: "4%", top: "1%" }} onClick={() => go("bench")}>
              follow the uplink ▸
            </Chip>
          </>
        );
      case "panel":
        return (
          <>
            <PatchPanel />
            {back}
            <Chip
              pos={{ left: "2.5%", top: "56%" }}
              onClick={() => go("farend")}
              pulse
            >
              see the far end ▸
            </Chip>
          </>
        );
      case "farend":
        return (
          <>
            <DualPatchPanel />
            {back}
            <Chip
              pos={{ right: "2.5%", top: "4%" }}
              onClick={() => go("bench")}
              pulse
            >
              follow the uplink home ▸
            </Chip>
          </>
        );
      case "bench":
        return (
          <>
            <IsoLab />
            {back}
            <div className="pointer-events-none absolute bottom-[4%] left-1/2 z-30 flex -translate-x-1/2 gap-2">
              <Chip pos={{ position: "relative" }} onClick={() => go("floor")}>
                ↺ start over
              </Chip>
              <Chip pos={{ position: "relative" }} href="/about" pulse>
                the full story →
              </Chip>
            </div>
          </>
        );
    }
  }

  const activeChapter = scene.cur === "farend" ? "panel" : scene.cur;
  const hero = variant === "hero";

  const rail = (
    <nav
      aria-label="Story chapters"
      className={
        hero
          ? "pointer-events-auto absolute top-[2.5%] left-1/2 z-30 flex -translate-x-1/2 items-center rounded-md border bg-background/95 px-1 font-mono text-[11px] backdrop-blur-sm"
          : "flex shrink-0 items-center gap-1 font-mono text-[11px]"
      }
    >
      {CHAPTERS.map((ch) => (
        <button
          key={ch.scene}
          type="button"
          onClick={() => go(ch.scene)}
          aria-label={`chapter ${ch.num} — ${ch.label}`}
          aria-current={activeChapter === ch.scene ? "step" : undefined}
          className={`rounded px-1.5 py-1.5 transition-colors ${
            activeChapter === ch.scene
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {ch.num}
          {!hero && activeChapter === ch.scene && (
            <span className="ml-1">{ch.label}</span>
          )}
        </button>
      ))}
    </nav>
  );

  const fit = (id: SceneId) =>
    hero && HERO_FIT[id] ? { width: `${HERO_FIT[id]}%` } : undefined;

  return (
    <div role="group" aria-label="Interactive cover: five chapters from a data center floor down to layer 1, ending at the home lab bench">
      <div
        ref={stageRef}
        tabIndex={-1}
        className="relative w-full overflow-hidden outline-none"
        style={{ aspectRatio: hero ? "640 / 370" : "640 / 420" }}
      >
        {scene.prev && (
          <div
            key={scene.prevKey}
            // inert kills hit-testing AND focus for the whole dying subtree —
            // the chips' own pointer-events-auto can't punch through it, and
            // aria-hidden never wraps focusable elements
            inert
            aria-hidden
            className={`pointer-events-none absolute inset-0 flex items-center justify-center ${
              scene.dir === "in" ? "story-exit-in" : "story-exit-out"
            }`}
            style={{ zIndex: scene.dir === "in" ? 20 : 10 }}
          >
            <div className="relative w-full" style={fit(scene.prev)}>
              {art(scene.prev)}
            </div>
          </div>
        )}
        <div
          key={scene.curKey}
          data-story-current
          className={`absolute inset-0 flex items-center justify-center ${
            scene.dir === "in" ? "story-enter-in" : "story-enter-out"
          }`}
          style={{ zIndex: scene.dir === "in" ? 10 : 20 }}
        >
          <div className="relative w-full" style={fit(scene.cur)}>
            {art(scene.cur)}
          </div>
        </div>

        {hero && rail}
      </div>

      {/* full variant: fig label + caption + chapter rail, outside the artwork */}
      {!hero && (
        <div className="mt-3 flex items-start justify-between gap-4 border-t border-line pt-3">
          <div className="min-w-0">
            <p
              key={`fig-${scene.cur}`}
              className="flip-item font-mono text-[11px] tracking-[0.1em] text-muted-foreground/70"
            >
              {FIG[scene.cur]}
            </p>
            <p
              key={`cap-${scene.cur}`}
              className="flip-item mt-1 min-h-[3.75rem] max-w-[54ch] font-mono text-xs leading-relaxed text-muted-foreground"
            >
              {CAPTION[scene.cur]}
            </p>
          </div>
          {rail}
        </div>
      )}

      {/* announce chapter changes to screen readers */}
      <p aria-live="polite" className="sr-only">
        {FIG[scene.cur]}
      </p>
    </div>
  );
}
