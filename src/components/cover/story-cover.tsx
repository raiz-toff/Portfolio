"use client";

// Candidate G — "the whole story".
// All six candidates merged into one interactive cover, told honestly: the
// facility is a daydream, and the story says so from the first caption. Five
// chapters zoom from the imagined floor down to eight copper conductors,
// then pull back for the truth — none of it is a facility; it's one
// hypervisor on a bench in Toronto.
//
//   01 the floor      (dc-floor: walk it, bfs pathfinding, hud)
//   02 the cold aisle (cold-aisle: pointer parallax, drifting when idle)
//   03 the rack       (crossover-rack: smil staged reveal, replays per visit)
//   04 layer 1        (patch-panel ⇄ dual-patch-panel: near end / far end)
//   05 the bench      (iso-lab: the truth)
//
// Navigation: hotspot chips on the artwork, a traceroute-style hop rail, and
// Escape to zoom back out. Transitions speak "camera": going deeper, the old
// view swells past the lens while the new one grows in from behind; going
// back out, the reverse. The chrome is choreographed around the move — chips
// detach during flight and land, staggered, once the scene settles. Each
// scene remounts on entry (keyed), and its SMIL timeline is rewound via
// setCurrentTime(0) so staged reveals replay.

import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";

import { useClickSound } from "@/hooks/use-click-sound";
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

// Where Escape (and the ← chip) takes you.
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
  aisle: "← the floor",
  rack: "← the aisle",
  panel: "← the rack",
  farend: "← the near end",
  bench: "← the rack",
};

// One plate of metadata per scene: figure code, chapter number, title, and
// the honest caption. The farend is chapter 04's b-side, not its own hop.
const SCENES: Record<
  SceneId,
  { fig: string; num: string; title: string; caption: string }
> = {
  floor: {
    fig: "FIG_010",
    num: "01",
    title: "the floor",
    caption:
      "every homelab starts as a daydream of a facility — cold air down the middle, heat off the backs, crac units holding the north wall. none of it is real. waddle around anyway: arrows, wasd, or tap a tile.",
  },
  aisle: {
    fig: "FIG_011",
    num: "02",
    title: "the cold aisle",
    caption:
      "inside the daydream it gains detail: supply air in your face, forty racks breathing link-light. still imaginary — but the physics is right.",
  },
  rack: {
    fig: "FIG_012",
    num: "03",
    title: "the rack",
    caption:
      "open one and the dream turns technical: t568a up top, t568b below, one dark fiber between them — and a switch that knows the way out.",
  },
  panel: {
    fig: "FIG_013",
    num: "04",
    title: "layer 1",
    caption:
      "the bottom of the stack: eight conductors in t568b order, orange-white on pin 1. everything above this line is an abstraction.",
  },
  farend: {
    fig: "FIG_013B",
    num: "04",
    title: "the far end",
    caption:
      "the same run, other end: a-standard here, b-standard there. swap the orange and green pairs by hand — that's a crossover.",
  },
  bench: {
    fig: "FIG_014",
    num: "05",
    title: "the bench",
    caption:
      "and the truth: there is no facility. there's a bench in toronto — pve-01 running eve-ng, cml and gitlab — one hypervisor carrying the whole dream.",
  },
};

// The five hops of the rail (farend folds into hop 04).
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
  order = 0,
  children,
}: {
  pos: React.CSSProperties;
  onClick?: () => void;
  href?: string;
  /** Primary affordance: green LED + stronger border — "continue the story". */
  pulse?: boolean;
  /** Entrance order; chips land staggered after the camera settles. */
  order?: number;
  children: React.ReactNode;
}) {
  const [click] = useClickSound();
  const className = `story-chip pointer-events-auto absolute z-30 flex cursor-pointer select-none items-center gap-1.5 rounded-full border bg-background/90 px-3 py-1.5 font-mono text-[11px] leading-none shadow-xs backdrop-blur-sm transition-[color,border-color,scale] duration-150 ease-out outline-none hover:border-ring hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring active:scale-[0.96] ${
    pulse
      ? "border-ring/60 text-foreground"
      : "border-line text-muted-foreground"
  }`;
  const style = {
    ...pos,
    "--chip-delay": `${460 + order * 90}ms`,
  } as React.CSSProperties;
  const dot = pulse ? (
    <span
      className="size-1.5 shrink-0 animate-pulse rounded-full bg-led-green motion-reduce:animate-none"
      aria-hidden
    />
  ) : null;
  if (href) {
    return (
      <Link href={href} onClick={click} className={className} style={style}>
        {dot}
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        click();
        onClick?.();
      }}
      className={className}
      style={style}
    >
      {dot}
      {children}
    </button>
  );
}

// The hop rail — chapters drawn like a traceroute: numbered stops joined by
// hairline segments. Passed hops stay lit, the current hop is a pill with a
// link LED and its name, hops ahead sit dim until you reach them.
function HopRail({
  hero,
  activeIdx,
  onGo,
}: {
  hero: boolean;
  activeIdx: number;
  onGo: (to: SceneId) => void;
}) {
  const [click] = useClickSound();
  return (
    <nav
      aria-label="Story chapters"
      className={
        hero
          ? "pointer-events-auto absolute top-[3%] left-1/2 z-30 flex -translate-x-1/2 items-center rounded-full border border-line bg-background/90 px-2 py-1 font-mono text-[10px] shadow-xs backdrop-blur-sm"
          : "flex items-center font-mono text-[11px]"
      }
    >
      {CHAPTERS.map((ch, i) => {
        const isActive = i === activeIdx;
        const visited = i < activeIdx;
        return (
          <Fragment key={ch.scene}>
            {i > 0 && (
              <span
                aria-hidden
                className={`h-px shrink-0 transition-colors duration-300 ${
                  hero ? "w-2" : "w-3"
                } ${i <= activeIdx ? "bg-ring" : "bg-border/70"}`}
              />
            )}
            <button
              type="button"
              onClick={() => {
                click();
                onGo(ch.scene);
              }}
              aria-label={`hop ${ch.num} — ${ch.label}`}
              aria-current={isActive ? "step" : undefined}
              className={`relative flex items-center rounded-full outline-none transition-[color,border-color,background-color] duration-300 after:absolute after:-inset-1.5 after:content-[''] focus-visible:ring-1 focus-visible:ring-ring ${
                hero ? "gap-1 px-1.5 py-0.5" : "gap-1.5 px-2 py-1"
              } ${
                isActive
                  ? "border border-ring/60 bg-muted/60 text-foreground"
                  : visited
                    ? "border border-transparent text-muted-foreground hover:text-foreground"
                    : "border border-transparent text-muted-foreground/50 hover:text-foreground"
              }`}
            >
              {isActive && (
                <span
                  className="size-1.5 shrink-0 animate-pulse rounded-full bg-led-green motion-reduce:animate-none"
                  aria-hidden
                />
              )}
              {ch.num}
              {!hero && isActive && <span>{ch.label}</span>}
            </button>
          </Fragment>
        );
      })}
    </nav>
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
   * "full": stage + chapter plate (fig · hop, title, caption) + hop rail
   * below (the cover lab). "hero": artwork only — tighter stage, the rail
   * overlaid up top and a chapter microcaption overlaid bottom-left (the
   * homepage figure slot).
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
  useEffect(() => {
    curRef.current = scene.cur;
  });

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
    }, 640);
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
            <DcFloor onNear={setNearRack} hud={false} />
            <Chip
              pos={{ right: "2%", bottom: "13%" }}
              onClick={() => go("aisle")}
              pulse
            >
              {nearRack
                ? `step in beside ${nearRack} →`
                : "walk to a rack, or step in →"}
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
              order={1}
              pulse
            >
              open the rack →
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
              order={1}
              pulse
            >
              trace layer 1 →
            </Chip>
            <Chip
              pos={{ right: "4%", top: "1%" }}
              onClick={() => go("bench")}
              order={2}
            >
              follow the uplink →
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
              order={1}
              pulse
            >
              see the far end →
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
              order={1}
              pulse
            >
              follow the uplink home →
            </Chip>
          </>
        );
      case "bench":
        return (
          <>
            <IsoLab />
            {back}
            <div className="pointer-events-none absolute bottom-[4%] left-1/2 z-30 flex -translate-x-1/2 gap-2">
              <Chip
                pos={{ position: "relative" }}
                onClick={() => go("floor")}
                order={1}
              >
                ↺ start over
              </Chip>
              <Chip pos={{ position: "relative" }} href="/about" order={2} pulse>
                the full story →
              </Chip>
            </div>
          </>
        );
    }
  }

  const meta = SCENES[scene.cur];
  const activeChapter = scene.cur === "farend" ? "panel" : scene.cur;
  const activeIdx = CHAPTERS.findIndex((c) => c.scene === activeChapter);
  const hero = variant === "hero";

  const fit = (id: SceneId) =>
    hero && HERO_FIT[id] ? { width: `${HERO_FIT[id]}%` } : undefined;

  return (
    <div
      role="group"
      aria-label="Interactive cover, told in five chapters: an imagined data center floor zooms down to layer 1, then pulls back to the real home-lab bench in Toronto"
    >
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

        {hero && <HopRail hero activeIdx={activeIdx} onGo={go} />}

        {/* hero: a small chapter plate so the story reads without the prose
            block. Hidden on the bench — its centered reveal chips own that
            edge of the frame. */}
        {hero && scene.cur !== "bench" && (
          <p
            key={`hcap-${scene.cur}`}
            className="flip-item pointer-events-none absolute bottom-[3.5%] left-[2%] z-30 flex items-baseline gap-1.5 rounded-full border border-line bg-background/85 px-2.5 py-1 font-mono text-[10px] leading-none backdrop-blur-sm"
          >
            <span className="tracking-[0.12em] text-muted-foreground/60 uppercase">
              {meta.fig}
            </span>
            <span className="text-muted-foreground">{meta.title}</span>
          </p>
        )}
      </div>

      {/* full variant: chapter plate + hop rail, outside the artwork */}
      {!hero && (
        <div className="mt-3 flex flex-col gap-4 border-t border-line pt-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <p
              key={`fig-${scene.cur}`}
              className="flip-item font-mono text-[10px] tracking-[0.15em] text-muted-foreground/60 uppercase"
            >
              {meta.fig} · ch_{meta.num}/05
            </p>
            <p
              key={`title-${scene.cur}`}
              className="flip-item mt-1.5 text-lg/none font-medium tracking-tight"
            >
              {meta.title}
            </p>
            <p
              key={`cap-${scene.cur}`}
              className="flip-item mt-2 min-h-[5.75rem] max-w-[58ch] text-sm leading-relaxed text-muted-foreground"
            >
              {meta.caption}
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground/60 uppercase">
              hop {meta.num} / 05
            </p>
            <HopRail hero={false} activeIdx={activeIdx} onGo={go} />
            <p className="font-mono text-[10px] text-muted-foreground/40">
              {PARENT[scene.cur] ? "esc — zoom out" : "click a hop to jump"}
            </p>
          </div>
        </div>
      )}

      {/* announce chapter changes to screen readers */}
      <p aria-live="polite" className="sr-only">
        {meta.fig} — {meta.title}
      </p>
    </div>
  );
}
