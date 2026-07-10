"use client";

// Candidate E — "the cold aisle".
// A one-point-perspective server row: raised floor tiles, ladder-rack ceiling
// trays, five depth layers of racks with flickering link LEDs. Pointer/touch
// position drives a lerped parallax across the depth layers; idle for 2.6s
// and it drifts on its own.
// This candidate genuinely needs client JS (continuous input + animation) —
// unlike the other candidates, there's no static/SMIL-only way to do this.

import { useEffect, useRef } from "react";

// ── deterministic PRNG for the LED brightness jitter ──────────────────────
// Math.random() at render time would make the server-rendered markup differ
// from the client's first render (a hydration mismatch). Seeding once here
// keeps the "randomness" stable across both.
function mulberry32(seed: number) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(1337);

const VPX = 320;

// ── raised floor tiles ──────────────────────────────────────────────────
const TILE_RADIAL_X = [72, 148, 224, 296, 344, 416, 492, 568];
const FLOOR_RADIAL = TILE_RADIAL_X.map((xb) => ({
  x1: xb,
  y1: 404,
  x2: VPX + (xb - VPX) * (27 / 219),
  y2: 212,
}));

const TILE_RING_U = [0.05, 0.12, 0.21, 0.33, 0.48, 0.67, 0.9];
const FLOOR_RINGS = TILE_RING_U.map((u) => {
  const y = 212 + 192 * u;
  const hw = 26 + 254 * ((y - 212) / 192);
  return { x1: VPX - hw, y1: y, x2: VPX + hw, y2: y };
});

// ── ceiling ladder-rack trays ───────────────────────────────────────────
type Pt = [number, number];
const TRAY_RUNG_T = [0.1, 0.22, 0.36, 0.52, 0.68, 0.84, 0.97];

function buildTray(outer1: Pt, outer2: Pt, inner1: Pt, inner2: Pt) {
  const rungs = TRAY_RUNG_T.map((t) => ({
    x1: outer1[0] + (outer2[0] - outer1[0]) * t,
    y1: outer1[1] + (outer2[1] - outer1[1]) * t,
    x2: inner1[0] + (inner2[0] - inner1[0]) * t,
    y2: inner1[1] + (inner2[1] - inner1[1]) * t,
  }));
  return {
    outer: { x1: outer1[0], y1: outer1[1], x2: outer2[0], y2: outer2[1] },
    inner: { x1: inner1[0], y1: inner1[1], x2: inner2[0], y2: inner2[1] },
    rungs,
  };
}
const TRAY_LEFT = buildTray([150, 6], [304, 172], [196, 6], [309, 172]);
const TRAY_RIGHT = buildTray([490, 6], [336, 172], [444, 6], [331, 172]);

// ── aisle light fixtures: [y, width, height], nearest (biggest) first ────
const AISLE_LIGHTS: [number, number, number][] = [
  [40, 44, 4],
  [98, 30, 3.2],
  [136, 20, 2.4],
  [160, 13, 1.8],
];

// ── racks, five depth layers, left + right row at each ──────────────────
type Led = {
  id: number;
  cx: number;
  cy: number;
  r: number;
  fill: string;
  opacity: number;
  flicker: boolean;
};
type GearGroup = {
  rectX: number;
  rectY: number;
  rectW: number;
  rectH: number;
  seamX1: number;
  seamY: number;
  seamX2: number;
  leds: Led[];
};
type RackData = {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  stroke: string;
  groups: GearGroup[];
};

let nextLedId = 0;
let amberBudget = 2;

function buildRack(
  side: "L" | "R",
  s: number,
  fill: string,
  stroke: string,
  amberHere: boolean
): RackData {
  const w = 95 * s;
  const x = side === "L" ? VPX - 305 * s : VPX + 210 * s;
  const y = 185 - 160 * s;
  const h = 370 * s;

  const groups: GearGroup[] = [];
  for (let gi = 0; gi < 3; gi++) {
    const gy = y + h * (0.1 + gi * 0.29);
    const gh = h * 0.17;
    const leds: Led[] = [];
    for (let li = 0; li < 4; li++) {
      const lx = x + w * (0.2 + li * 0.19);
      const ly = gy + gh * 0.32;
      const isAmber = amberHere && gi === 1 && li === 2 && amberBudget > 0;
      if (isAmber) amberBudget--;
      leds.push({
        id: nextLedId++,
        cx: lx,
        cy: ly,
        r: Math.max(2.1 * s, 0.9),
        fill: isAmber ? "var(--led-amber)" : "var(--led-green)",
        opacity: isAmber ? 1 : Number((0.5 + rand() * 0.5).toFixed(2)),
        flicker: !isAmber,
      });
    }
    groups.push({
      rectX: x + 3 * s,
      rectY: gy,
      rectW: w - 6 * s,
      rectH: gh,
      seamX1: x + 6 * s,
      seamY: gy + gh * 0.68,
      seamX2: x + w - 6 * s,
      leds,
    });
  }
  return { x, y, w, h, fill, stroke, groups };
}

// Near racks read as more lit/visible, far racks fade toward shadow — a
// depth cue that has to work in both themes, so each fill/stroke is a
// color-mix blend between the "near" and "far" hardware tokens (see
// globals.css) rather than a fixed hex step.
function depthFill(s: number) {
  return `color-mix(in oklab, var(--hw-face-3) ${Math.round(s * 100)}%, var(--hw-well))`;
}
function depthStroke(s: number) {
  return `color-mix(in oklab, var(--hw-stroke) ${Math.round(s * 100)}%, var(--hw-stroke-soft))`;
}

const DEPTHS = [
  { s: 0.31, layer: "pfar" as const },
  { s: 0.41, layer: "pfar" as const },
  { s: 0.55, layer: "pmid" as const },
  { s: 0.74, layer: "pmid" as const },
  { s: 1.0, layer: "pnear" as const },
].map((d) => ({ ...d, f: depthFill(d.s), st: depthStroke(d.s) }));

const RACKS: { layer: "pfar" | "pmid" | "pnear"; data: RackData }[] = [];
DEPTHS.forEach((d, i) => {
  RACKS.push({ layer: d.layer, data: buildRack("L", d.s, d.f, d.st, i === 2) });
  RACKS.push({ layer: d.layer, data: buildRack("R", d.s, d.f, d.st, i === 4) });
});

function Rack({
  data,
  ledRefs,
}: {
  data: RackData;
  ledRefs: React.RefObject<Map<number, SVGCircleElement>>;
}) {
  return (
    <>
      <rect x={data.x} y={data.y} width={data.w} height={data.h} rx={data.w * 0.015} fill={data.fill} stroke={data.stroke} strokeWidth={1} />
      {data.groups.map((g, gi) => (
        <g key={gi}>
          <rect x={g.rectX} y={g.rectY} width={g.rectW} height={g.rectH} rx={data.w * 0.02} fill="var(--hw-well)" />
          <line x1={g.seamX1} y1={g.seamY} x2={g.seamX2} y2={g.seamY} stroke="var(--hw-stroke-soft)" strokeWidth={1} />
          {g.leds.map((led) => (
            <circle
              key={led.id}
              ref={
                led.flicker
                  ? (el) => {
                      if (el) ledRefs.current.set(led.id, el);
                    }
                  : undefined
              }
              cx={led.cx}
              cy={led.cy}
              r={led.r}
              fill={led.fill}
              opacity={led.opacity}
            />
          ))}
        </g>
      ))}
    </>
  );
}

export default function ColdAisle(props: React.ComponentProps<"svg">) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pfarRef = useRef<SVGGElement>(null);
  const pmidRef = useRef<SVGGElement>(null);
  const pnearRef = useRef<SVGGElement>(null);
  const pceilRef = useRef<SVGGElement>(null);
  const pfloorRef = useRef<SVGGElement>(null);
  const ledRefs = useRef<Map<number, SVGCircleElement>>(new Map());

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const layers = [
      { el: pnearRef.current, k: 13 },
      { el: pmidRef.current, k: 7 },
      { el: pfarRef.current, k: 3 },
      { el: pceilRef.current, k: 6 },
      { el: pfloorRef.current, k: 6 },
    ].filter((l): l is { el: SVGGElement; k: number } => l.el !== null);

    let tx = 0,
      ty = 0,
      cx = 0,
      cy = 0,
      lastMove = 0,
      phase = 0;
    let raf = 0;

    function setTarget(clientX: number, clientY: number) {
      const r = svg!.getBoundingClientRect();
      tx = (clientX - r.left) / r.width - 0.5;
      ty = (clientY - r.top) / r.height - 0.5;
      lastMove = Date.now();
    }
    function onPointerMove(e: PointerEvent) {
      setTarget(e.clientX, e.clientY);
    }
    function onTouchMove(e: TouchEvent) {
      if (e.touches[0]) setTarget(e.touches[0].clientX, e.touches[0].clientY);
    }

    svg.addEventListener("pointermove", onPointerMove);
    svg.addEventListener("touchmove", onTouchMove, { passive: true });

    function tick() {
      if (Date.now() - lastMove > 2600) {
        phase += 0.006;
        tx = Math.sin(phase) * 0.16;
        ty = Math.cos(phase * 0.7) * 0.08;
      }
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      layers.forEach((l) => {
        l.el.setAttribute("transform", `translate(${(-cx * l.k).toFixed(2)},${(-cy * l.k * 0.5).toFixed(2)})`);
      });
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    const flickerInterval = setInterval(() => {
      const entries = Array.from(ledRefs.current.values());
      if (!entries.length) return;
      for (let n = 0; n < 3; n++) {
        const c = entries[Math.floor(Math.random() * entries.length)];
        const prev = c.getAttribute("opacity");
        c.setAttribute("opacity", "0.15");
        setTimeout(() => c.setAttribute("opacity", prev ?? "1"), 140 + Math.random() * 200);
      }
    }, 320);

    return () => {
      svg.removeEventListener("pointermove", onPointerMove);
      svg.removeEventListener("touchmove", onTouchMove);
      cancelAnimationFrame(raf);
      clearInterval(flickerInterval);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 640 410"
      className="block w-full touch-none"
      role="img"
      aria-label="A data center cold aisle in one-point perspective, with racks receding into the distance. The scene shifts gently with pointer movement."
      {...props}
    >
      <g ref={pfloorRef}>
        <polygon points="40,404 600,404 346,212 294,212" fill="var(--hw-well)" />
        {FLOOR_RADIAL.map((l, i) => (
          <line key={`fr${i}`} {...l} stroke="var(--hw-stroke-soft)" strokeWidth={1} />
        ))}
        {FLOOR_RINGS.map((l, i) => (
          <line key={`fg${i}`} {...l} stroke="var(--hw-stroke-soft)" strokeWidth={1} />
        ))}
      </g>

      <g ref={pceilRef}>
        <line {...TRAY_LEFT.outer} stroke="var(--hw-stroke)" strokeWidth={1.5} />
        <line {...TRAY_LEFT.inner} stroke="var(--hw-stroke)" strokeWidth={1.5} />
        {TRAY_LEFT.rungs.map((r, i) => (
          <line key={`tl${i}`} {...r} stroke="var(--hw-stroke-soft)" strokeWidth={1.2} />
        ))}
        <line {...TRAY_RIGHT.outer} stroke="var(--hw-stroke)" strokeWidth={1.5} />
        <line {...TRAY_RIGHT.inner} stroke="var(--hw-stroke)" strokeWidth={1.5} />
        {TRAY_RIGHT.rungs.map((r, i) => (
          <line key={`tr${i}`} {...r} stroke="var(--hw-stroke-soft)" strokeWidth={1.2} />
        ))}
        {AISLE_LIGHTS.map(([ly, w, h], i) => (
          <rect key={i} x={VPX - w / 2} y={ly} width={w} height={h} rx={1} fill="var(--hw-face-2)" />
        ))}
      </g>

      <g ref={pfarRef}>
        {RACKS.filter((r) => r.layer === "pfar").map((r, i) => (
          <Rack key={i} data={r.data} ledRefs={ledRefs} />
        ))}
      </g>
      <g ref={pmidRef}>
        {RACKS.filter((r) => r.layer === "pmid").map((r, i) => (
          <Rack key={i} data={r.data} ledRefs={ledRefs} />
        ))}
      </g>
      <g ref={pnearRef}>
        {RACKS.filter((r) => r.layer === "pnear").map((r, i) => (
          <Rack key={i} data={r.data} ledRefs={ledRefs} />
        ))}
      </g>
    </svg>
  );
}
