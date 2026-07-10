"use client";

// Candidate F — "the floor, walkable".
// Isometric data center floor plan, viewed from above: four rack rows, hot
// and cold aisles, three CRAC units. A marker walks the floor — arrow/WASD
// keys or tapping a tile, BFS pathfinding around racks — and nearby racks
// reveal their labels while a HUD line reports the current zone. Genuinely
// stateful (pathfinding, walk queue, depth-sorted z-order), so this is a
// "use client" component: static geometry renders once from precomputed
// data, and a single effect runs the walk/highlight/flicker loop via refs
// (mirrors Candidate E's approach — no re-renders on every animation tick).

import { useEffect, useRef } from "react";

import { useStepSound } from "@/hooks/use-step-sound";

// ── deterministic PRNG for the LED brightness jitter (see cold-aisle.tsx
// for why this can't be Math.random() at render time) ────────────────────
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
const rand = mulberry32(4242);

const OX = 280;
const OY = 70;
const COLS = 13;
const ROWS = 9;

function project(gx: number, gy: number): [number, number] {
  return [OX + (gx - gy) * 20, OY + (gx + gy) * 10];
}

// ── walkability grid: rack rows + CRAC row ────────────────────────────────
const SOLID: boolean[][] = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
for (const gy of [1, 3, 5, 7]) for (let gx = 2; gx <= 10; gx++) SOLID[gy][gx] = true;
for (const gx of [3, 6, 9]) SOLID[0][gx] = true;

function walkable(x: number, y: number) {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS && !SOLID[y][x];
}

// ── floor lattice + cold-aisle grates ─────────────────────────────────────
// The grid is drawn as long dashed lattice lines (one per row/column edge)
// rather than per-tile diamonds — dashes stay continuous across the floor,
// matching the bench scene's dashed-wireframe language.
type Seg = { x1: number; y1: number; x2: number; y2: number };

function seg(a: [number, number], b: [number, number]): Seg {
  return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
}

const GRID_LINES: Seg[] = (() => {
  const out: Seg[] = [];
  for (let k = 0; k <= COLS; k++) {
    out.push(seg(project(k - 0.5, -0.5), project(k - 0.5, ROWS - 0.5)));
  }
  for (let m = 0; m <= ROWS; m++) {
    out.push(seg(project(-0.5, m - 0.5), project(COLS - 0.5, m - 0.5)));
  }
  return out;
})();

const GRATES: Seg[] = (() => {
  const out: Seg[] = [];
  for (let gx = 0; gx < COLS; gx++) {
    if (SOLID[4][gx]) continue;
    const [sx, sy] = project(gx, 4);
    out.push({ x1: sx - 10, y1: sy - 3, x2: sx + 6, y2: sy + 5 });
    out.push({ x1: sx - 4, y1: sy - 6, x2: sx + 12, y2: sy + 2 });
  }
  return out;
})();

// ── conduits + an unbuilt pad: the same dashed traces and wireframe boxes
// the bench scene uses, running off-canvas along the iso axes ─────────────
const CONDUITS = [
  // west corner, jogging down-left then off the left edge
  "M 100 150 L 40 180 L -24 148",
  // south corner, straight off the bottom-right
  "M 360 280 L 456 328",
  // north corner, up-right then off the top
  "M 280 60 L 360 20 L 300 -10",
];

// Dashed wireframe cuboid on the floor lattice — an unbuilt expansion pad,
// same language as the bench scene's unbuilt zones.
const WIRE_PAD = (() => {
  const gx = 1, gy = 11, w = 3, d = 2, h = 26;
  const base: [number, number][] = [
    project(gx, gy),
    project(gx + w, gy),
    project(gx + w, gy + d),
    project(gx, gy + d),
  ];
  const top = base.map(([x, y]) => [x, y - h] as [number, number]);
  return {
    base: base.map((p) => p.join(",")).join(" "),
    top: top.map((p) => p.join(",")).join(" "),
    posts: base.map((p, i) => seg(p, top[i])),
  };
})();

const AISLE_LABELS = [2, 4, 6].map((row, i) => {
  const [sx, sy] = project(0.6, row);
  return { x: sx - 26, y: sy + 3, label: ["hot", "cold", "hot"][i] };
});

// ── racks + CRAC units ─────────────────────────────────────────────────
type Led = { id: number; cx: number; cy: number; r: number; opacity: number };
type BoxData = {
  key: string;
  gx: number;
  gy: number;
  sum: number;
  name: string;
  accent: string | null;
  west: string;
  east: string;
  top: string;
  hatch: { x1: number; y1: number; x2: number; y2: number }[];
  leds: Led[];
  labelX: number;
  labelY: number;
  labelW: number;
};

let nextLedId = 0;

function buildBox(
  gx: number,
  gy: number,
  h: number,
  name: string,
  accent: string | null,
  hatchTop: boolean
): BoxData {
  const [sx, sy] = project(gx, gy);
  const W: [number, number] = [sx - 20, sy];
  const E: [number, number] = [sx + 20, sy];
  const N: [number, number] = [sx, sy - 10];
  const S: [number, number] = [sx, sy + 10];

  const west = `${W} ${S} ${S[0]},${S[1] - h} ${W[0]},${W[1] - h}`;
  const east = `${S} ${E} ${E[0]},${E[1] - h} ${S[0]},${S[1] - h}`;
  const top = `${N[0]},${N[1] - h} ${E[0]},${E[1] - h} ${S[0]},${S[1] - h} ${W[0]},${W[1] - h}`;

  const hatch = hatchTop
    ? Array.from({ length: 3 }, (_, i) => ({
        x1: sx - 12 + i * 4,
        y1: sy - h - 4 + i * 2,
        x2: sx + 4 + i * 4,
        y2: sy - h + 4 + i * 2,
      }))
    : [];

  const leds = hatchTop
    ? []
    : Array.from({ length: 3 }, (_, i) => {
        const t = 0.28 + i * 0.22;
        return {
          id: nextLedId++,
          cx: W[0] + (S[0] - W[0]) * t,
          cy: W[1] + (S[1] - W[1]) * t - h * 0.55,
          r: 1.1,
          opacity: Number((0.4 + rand() * 0.6).toFixed(2)),
        };
      });

  return {
    key: `${gx},${gy}`,
    gx,
    gy,
    sum: gx + gy,
    name,
    accent,
    west,
    east,
    top,
    hatch,
    leds,
    labelX: sx,
    labelY: sy - h - 7,
    labelW: name.length * 6.1 + 10,
  };
}

const ROW_LETTER: Record<number, string> = { 1: "a", 3: "b", 5: "c", 7: "d" };
const DEFAULT_STROKE = "var(--hw-stroke)";

// built racks-first then CRACs; the world layer renders them sorted by
// depth-sum so document order IS painter order (see reorder() below)
const BOXES: BoxData[] = [];
for (const gy of [1, 3, 5, 7]) {
  for (let gx = 2; gx <= 10; gx++) {
    let name = `r-${ROW_LETTER[gy]}${gx < 10 ? "0" + gx : gx}`;
    let accent: string | null = null;
    if (gy === 3 && gx === 6) {
      name = "core // spine";
      accent = "var(--led-teal)";
    }
    if (gy === 7 && gx === 10) {
      name = "pve-01 // home.lab";
      accent = "var(--led-green)";
    }
    BOXES.push(buildBox(gx, gy, 34, name, accent, false));
  }
}
for (const gx of [3, 6, 9]) {
  BOXES.push(buildBox(gx, 0, 22, gx === 6 ? "crac" : "", gx === 6 ? "var(--hw-label)" : null, true));
}

const BOX_BY_KEY = new Map(BOXES.map((b) => [b.key, b]));

function Box({
  data,
  polyRefs,
  ledRefs,
}: {
  data: BoxData;
  polyRefs: React.RefObject<Map<string, SVGPolygonElement[]>>;
  ledRefs: React.RefObject<Map<number, SVGCircleElement>>;
}) {
  const stroke = data.accent ?? DEFAULT_STROKE;
  const setPoly = (el: SVGPolygonElement | null) => {
    if (!el) return;
    const arr = polyRefs.current.get(data.key) ?? [];
    // React re-attaches inline ref callbacks on re-render; dedup so the
    // highlight arrays don't grow when a parent re-render passes through
    if (!arr.includes(el)) arr.push(el);
    polyRefs.current.set(data.key, arr);
  };
  return (
    <g data-sum={data.sum} opacity={0} style={{ transition: "opacity 0.5s" }}>
      <polygon ref={setPoly} points={data.west} fill="var(--hw-face-1)" stroke={stroke} strokeWidth={1} />
      <polygon ref={setPoly} points={data.east} fill="var(--hw-face-2)" stroke={stroke} strokeWidth={1} />
      <polygon ref={setPoly} points={data.top} fill="var(--hw-face-3)" stroke={stroke} strokeWidth={1} />
      {data.hatch.map((h, i) => (
        <line key={i} x1={h.x1} y1={h.y1} x2={h.x2} y2={h.y2} stroke="var(--hw-stroke-soft)" strokeWidth={1} />
      ))}
      {data.leds.map((led) => (
        <circle
          key={led.id}
          ref={(el) => {
            if (el) ledRefs.current.set(led.id, el);
          }}
          cx={led.cx}
          cy={led.cy}
          r={led.r}
          fill="var(--led-green)"
          opacity={led.opacity}
        />
      ))}
    </g>
  );
}

export default function DcFloor({
  onNear,
  hud = true,
  ...props
}: {
  /** Reports the rack the marker is beside after each move (null in open floor). */
  onNear?: (rack: string | null) => void;
  /** The zone/controls line under the artwork. The story cover hides it — its chips and captions carry that information. */
  hud?: boolean;
} & React.ComponentProps<"div">) {
  const onNearRef = useRef(onNear);
  useEffect(() => {
    onNearRef.current = onNear;
  });
  const [playStep] = useStepSound();

  const svgRef = useRef<SVGSVGElement>(null);
  const worldRef = useRef<SVGGElement>(null);
  const playerRef = useRef<SVGGElement>(null);
  const tuxRef = useRef<SVGGElement>(null);
  const ringRef = useRef<SVGEllipseElement>(null);
  const hudRef = useRef<HTMLSpanElement>(null);
  const polyRefs = useRef<Map<string, SVGPolygonElement[]>>(new Map());
  const labelRefs = useRef<Map<string, SVGTextElement>>(new Map());
  const ledRefs = useRef<Map<number, SVGCircleElement>>(new Map());

  useEffect(() => {
    const svg = svgRef.current;
    const world = worldRef.current;
    const player = playerRef.current;
    const tux = tuxRef.current;
    const ring = ringRef.current;
    if (!svg || !world || !player || !tux || !ring) return;

    // entrance stagger, matches the original's setTimeout-per-box reveal
    const enterTimers = BOXES.map((b) =>
      window.setTimeout(() => {
        const polys = polyRefs.current.get(b.key);
        const g = polys?.[0]?.parentElement as SVGGElement | undefined;
        g?.setAttribute("opacity", "1");
      }, 200 + b.sum * 45)
    );

    // Spawn on the south walkway beside pve-01: every box that could draw
    // over this tile sits at a lower depth-sum, so the penguin is fully
    // visible the moment the floor loads — and it starts the story at home.
    let pg: [number, number] = [10, 8];

    // Painter's order for the penguin. Children are sum-sorted, so a single
    // insertion point works: boxes with data-sum ≤ threshold draw behind the
    // player, the rest in front. Callers pass tileSum + 1 — the sprite wins
    // ties against racks merely BESIDE it on the seam (their corners would
    // otherwise clip its shoulders), and only a rack directly in front of it
    // in its own column (sum + 2, the true "behind the tower" case) occludes.
    function reorder(threshold: number) {
      let ref: Element | null = null;
      for (const k of Array.from(world!.children)) {
        if (k !== player && Number(k.getAttribute("data-sum")) > threshold) {
          ref = k;
          break;
        }
      }
      world!.insertBefore(player!, ref);
    }

    function placePlayer(x: number, y: number) {
      player!.setAttribute("transform", `translate(${x},${y})`);
    }

    let cur = project(pg[0], pg[1]);
    placePlayer(cur[0], cur[1]);
    reorder(pg[0] + pg[1] + 1);

    let ringR = 6;
    let ringO = 0.8;
    const ringInterval = window.setInterval(() => {
      ringR += 0.5;
      ringO -= 0.04;
      if (ringR > 16) {
        ringR = 6;
        ringO = 0.8;
      }
      ring!.setAttribute("rx", String(ringR));
      ring!.setAttribute("ry", String(ringR / 2));
      ring!.setAttribute("opacity", String(Math.max(ringO, 0)));
    }, 50);

    const flickerInterval = window.setInterval(() => {
      const entries = Array.from(ledRefs.current.values());
      if (!entries.length) return;
      for (let n = 0; n < 3; n++) {
        const c = entries[Math.floor(Math.random() * entries.length)];
        const prev = c.getAttribute("opacity");
        c.setAttribute("opacity", "0.1");
        window.setTimeout(() => c.setAttribute("opacity", prev ?? "0.6"), 150 + Math.random() * 200);
      }
    }, 340);

    let highlighted: string[] = [];
    let shownLabel: string | null = null;

    function updateHud() {
      // un-highlight and hide the previous frame's state
      highlighted.forEach((key) => {
        const box = BOX_BY_KEY.get(key)!;
        polyRefs.current.get(key)?.forEach((p) => p.setAttribute("stroke", box.accent ?? DEFAULT_STROKE));
      });
      highlighted = [];
      if (shownLabel && !BOX_BY_KEY.get(shownLabel)?.accent) {
        const g = labelRefs.current.get(shownLabel)?.parentElement;
        g?.setAttribute("opacity", "0");
      }
      shownLabel = null;

      const [gx, gy] = pg;
      let zone = "perimeter";
      if (gy === 4) zone = "cold aisle";
      else if (gy === 2 || gy === 6) zone = "hot aisle";
      else if (gy === 0) zone = "north wall";

      // outline every adjacent rack (cheap, doesn't crowd the scene), but
      // only surface ONE floating label — the nearest — so labels never pile
      // up when the marker is boxed in on multiple sides. The HUD line below
      // still names the same rack, so nothing is lost, just decluttered.
      let near = "";
      ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).forEach(([dx, dy]) => {
        const key = `${gx + dx},${gy + dy}`;
        const box = BOX_BY_KEY.get(key);
        if (box) {
          polyRefs.current.get(key)?.forEach((p) => p.setAttribute("stroke", "var(--hw-stroke-strong)"));
          highlighted.push(key);
          if (!near) {
            near = box.name;
            if (!box.accent) {
              const g = labelRefs.current.get(key)?.parentElement;
              g?.setAttribute("opacity", "1");
              shownLabel = key;
            }
          }
        }
      });
      if (hudRef.current) {
        hudRef.current.textContent = zone + (near ? ` — beside ${near}` : "");
      }
      onNearRef.current?.(near || null);
    }
    updateHud();

    let queue: [number, number][] = [];
    let walking = false;
    let walkRaf = 0;
    // waddle state: tilt alternates per tile (matching the alternating
    // footstep pitch), and the penguin faces the way it's moving
    let facing = 1;
    let stepParity = 0;

    function step() {
      if (!queue.length) {
        walking = false;
        tux!.setAttribute("transform", `scale(${facing} 1)`);
        updateHud();
        return;
      }
      walking = true;
      const nxt = queue.shift()!;
      playStep();
      stepParity ^= 1;
      const tilt = stepParity ? 7 : -7;
      const from = cur.slice() as [number, number];
      const to = project(nxt[0], nxt[1]);
      if (to[0] !== from[0]) facing = to[0] > from[0] ? 1 : -1;
      // mid-step the sprite spans both tiles; order by the more visible one
      // so it never dips behind a rack a frame early
      reorder(Math.max(pg[0] + pg[1], nxt[0] + nxt[1]) + 1);
      const t0 = performance.now();
      function anim(t: number) {
        const u = Math.min((t - t0) / 140, 1);
        placePlayer(from[0] + (to[0] - from[0]) * u, from[1] + (to[1] - from[1]) * u);
        // one waddle cycle per tile: rock to this step's side + a small hop
        const sw = Math.sin(u * Math.PI);
        tux!.setAttribute(
          "transform",
          `scale(${facing} 1) translate(0 ${(-sw * 1.3).toFixed(2)}) rotate(${(sw * tilt).toFixed(2)})`
        );
        if (u < 1) {
          walkRaf = requestAnimationFrame(anim);
        } else {
          cur = to;
          pg = nxt;
          step();
        }
      }
      walkRaf = requestAnimationFrame(anim);
    }

    function bfs(target: [number, number]): [number, number][] | null {
      const key = (p: [number, number]) => `${p[0]},${p[1]}`;
      const prev = new Map<string, [number, number] | null>();
      prev.set(key(pg), null);
      const q: [number, number][] = [pg];
      while (q.length) {
        const c = q.shift()!;
        if (c[0] === target[0] && c[1] === target[1]) {
          const path: [number, number][] = [];
          let k: [number, number] | null = c;
          while (k && !(k[0] === pg[0] && k[1] === pg[1])) {
            path.unshift(k);
            k = prev.get(key(k)) ?? null;
          }
          return path;
        }
        ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).forEach(([dx, dy]) => {
          const n: [number, number] = [c[0] + dx, c[1] + dy];
          if (walkable(n[0], n[1]) && !prev.has(key(n))) {
            prev.set(key(n), c);
            q.push(n);
          }
        });
      }
      return null;
    }

    function goTo(gx: number, gy: number) {
      if (!walkable(gx, gy)) {
        const opts: [number, number][] = [
          [gx, gy + 1],
          [gx, gy - 1],
          [gx + 1, gy],
          [gx - 1, gy],
        ].filter((o) => walkable(o[0], o[1])) as [number, number][];
        if (!opts.length) return;
        let best: [number, number][] | null = null;
        opts.forEach((o) => {
          const p = bfs(o);
          if (p && (!best || p.length < best.length)) best = p;
        });
        if (best) {
          queue = best;
          if (!walking) step();
        }
        return;
      }
      const p = bfs([gx, gy]);
      if (p) {
        queue = p;
        if (!walking) step();
      }
    }

    function onClick(e: MouseEvent) {
      const r = svg!.getBoundingClientRect();
      const vx = ((e.clientX - r.left) / r.width) * 640;
      const vy = ((e.clientY - r.top) / r.height) * 320;
      const gx = Math.round((((vx - OX) / 20) + (vy - OY) / 10) / 2);
      const gy = Math.round(((vy - OY) / 10 - (vx - OX) / 20) / 2);
      goTo(gx, gy);
    }
    svg.addEventListener("click", onClick);

    const KEY_DELTA: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      w: [0, -1],
      s: [0, 1],
      a: [-1, 0],
      d: [1, 0],
    };
    // Only steer (and swallow arrow-key scrolling) while the floor is
    // actually on screen — the cover lab can render several candidates,
    // and a second instance shouldn't react to keys meant for another.
    let inView = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
      },
      { threshold: 0.25 }
    );
    io.observe(svg);
    function onKeydown(e: KeyboardEvent) {
      if (!inView) return;
      const d = KEY_DELTA[e.key];
      if (!d) return;
      e.preventDefault();
      if (walking) return;
      const n: [number, number] = [pg[0] + d[0], pg[1] + d[1]];
      if (walkable(n[0], n[1])) {
        queue = [n];
        step();
      }
    }
    window.addEventListener("keydown", onKeydown);

    return () => {
      enterTimers.forEach((t) => window.clearTimeout(t));
      window.clearInterval(ringInterval);
      window.clearInterval(flickerInterval);
      cancelAnimationFrame(walkRaf);
      io.disconnect();
      svg.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKeydown);
    };
  }, [playStep]);

  return (
    <div {...props}>
      <svg
        ref={svgRef}
        viewBox="0 0 640 320"
        className="block w-full cursor-pointer touch-manipulation"
        role="img"
        aria-label="An isometric data center floor plan viewed from above, with four rack rows, hot and cold aisles, and CRAC units. A small penguin can be walked with arrow keys, WASD, or by clicking a tile; it waddles around racks, and nearby racks reveal their labels."
      >
        <g>
          {GRID_LINES.map((l, i) => (
            <line key={`gl${i}`} {...l} stroke="var(--hw-stroke-soft)" strokeWidth={1} strokeDasharray="3 3" />
          ))}
          {GRATES.map((l, i) => (
            <line key={`gr${i}`} {...l} stroke="var(--hw-stroke-soft)" strokeWidth={1} />
          ))}
        </g>

        {/* background story: dashed conduits running off-canvas + an unbuilt
            expansion pad — the bench scene's wireframe language, up here on
            the floor so the first chapter and the last one rhyme */}
        <g fill="none" stroke="var(--border)">
          {CONDUITS.map((d, i) => (
            <path key={`cd${i}`} d={d} strokeDasharray="4 4" />
          ))}
          <polygon points={WIRE_PAD.base} strokeDasharray="3 3" />
          <polygon points={WIRE_PAD.top} strokeDasharray="3 3" />
          {WIRE_PAD.posts.map((l, i) => (
            <line key={`wp${i}`} {...l} strokeDasharray="3 3" />
          ))}
        </g>

        <g ref={worldRef}>
          {[...BOXES]
            .sort((a, b) => a.sum - b.sum)
            .map((b) => (
              <Box key={b.key} data={b} polyRefs={polyRefs} ledRefs={ledRefs} />
            ))}
          <g ref={playerRef} id="dc-player">
            {/* position ripple, projected onto the floor plane */}
            <ellipse ref={ringRef} cx={0} cy={0} rx={6} ry={3} fill="none" stroke="var(--led-green)" strokeWidth={1} opacity={0} />
            {/* the resident tux — theme-aware (foreground body, background
                belly, amber beak/feet); the walk loop drives its waddle */}
            <g ref={tuxRef}>
              <ellipse cx={0} cy={0.3} rx={4.6} ry={1.6} fill="var(--hw-well)" opacity={0.3} />
              <ellipse cx={-2} cy={-0.3} rx={1.8} ry={1} fill="var(--led-amber)" />
              <ellipse cx={2} cy={-0.3} rx={1.8} ry={1} fill="var(--led-amber)" />
              <ellipse cx={0} cy={-7} rx={4.9} ry={6.4} fill="var(--foreground)" />
              <ellipse cx={-4.7} cy={-6.4} rx={1.2} ry={3.1} transform="rotate(12 -4.7 -6.4)" fill="var(--foreground)" />
              <ellipse cx={4.7} cy={-6.4} rx={1.2} ry={3.1} transform="rotate(-12 4.7 -6.4)" fill="var(--foreground)" />
              <ellipse cx={0} cy={-5.4} rx={3.1} ry={4.4} fill="var(--background)" />
              <circle cx={0} cy={-14} r={3.6} fill="var(--foreground)" />
              <circle cx={-1.3} cy={-14.6} r={0.85} fill="var(--background)" />
              <circle cx={1.3} cy={-14.6} r={0.85} fill="var(--background)" />
              <polygon points="-1.5,-13.2 1.5,-13.2 0,-11.6" fill="var(--led-amber)" />
            </g>
          </g>
        </g>

        <g>
          {AISLE_LABELS.map((a, i) => (
            <text key={i} x={a.x} y={a.y} className="font-mono" fontSize={10} fill="var(--hw-label-dim)">
              {a.label}
            </text>
          ))}
          {BOXES.map((b) => (
            <g key={b.key} opacity={b.accent ? 1 : 0}>
              <rect
                x={b.labelX - b.labelW / 2}
                y={b.labelY - 10}
                width={b.labelW}
                height={13}
                rx={6.5}
                fill="var(--muted)"
                fillOpacity={0.85}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text
                ref={(el) => {
                  if (el) labelRefs.current.set(b.key, el);
                }}
                x={b.labelX}
                y={b.labelY}
                textAnchor="middle"
                className="font-mono"
                fontSize={10}
                fill={b.accent ?? "var(--hw-label)"}
              >
                {b.name}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {hud && (
        <div className="flex items-center justify-between px-1 pt-1 font-mono text-xs">
          <span ref={hudRef} className="text-muted-foreground">
            perimeter — beside pve-01 // home.lab
          </span>
          <span className="text-muted-foreground/40">tap a tile or use arrows / wasd</span>
        </div>
      )}
    </div>
  );
}
