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

// ── floor tiles + cold-aisle grates ───────────────────────────────────────
const TILES = (() => {
  const out: {
    gx: number;
    gy: number;
    points: string;
    grate: { x1: number; y1: number; x2: number; y2: number }[];
  }[] = [];
  for (let gy = 0; gy < ROWS; gy++) {
    for (let gx = 0; gx < COLS; gx++) {
      const [sx, sy] = project(gx, gy);
      const points = `${sx},${sy - 10} ${sx + 20},${sy} ${sx},${sy + 10} ${sx - 20},${sy}`;
      const grate =
        gy === 4 && !SOLID[gy][gx]
          ? [
              { x1: sx - 10, y1: sy - 3, x2: sx + 6, y2: sy + 5 },
              { x1: sx - 4, y1: sy - 6, x2: sx + 12, y2: sy + 2 },
            ]
          : [];
      out.push({ gx, gy, points, grate });
    }
  }
  return out;
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

// racks first (matches original document order — see reorder() below), then CRACs
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
  labelRefs,
  ledRefs,
}: {
  data: BoxData;
  polyRefs: React.RefObject<Map<string, SVGPolygonElement[]>>;
  labelRefs: React.RefObject<Map<string, SVGTextElement>>;
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
  ...props
}: {
  /** Reports the rack the marker is beside after each move (null in open floor). */
  onNear?: (rack: string | null) => void;
} & React.ComponentProps<"div">) {
  const onNearRef = useRef(onNear);
  onNearRef.current = onNear;

  const svgRef = useRef<SVGSVGElement>(null);
  const worldRef = useRef<SVGGElement>(null);
  const playerRef = useRef<SVGGElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const hudRef = useRef<HTMLSpanElement>(null);
  const polyRefs = useRef<Map<string, SVGPolygonElement[]>>(new Map());
  const labelRefs = useRef<Map<string, SVGTextElement>>(new Map());
  const ledRefs = useRef<Map<number, SVGCircleElement>>(new Map());

  useEffect(() => {
    const svg = svgRef.current;
    const world = worldRef.current;
    const player = playerRef.current;
    const ring = ringRef.current;
    const hud = hudRef.current;
    if (!svg || !world || !player || !ring || !hud) return;

    // entrance stagger, matches the original's setTimeout-per-box reveal
    const enterTimers = BOXES.map((b, i) =>
      window.setTimeout(() => {
        const polys = polyRefs.current.get(b.key);
        const g = polys?.[0]?.parentElement as SVGGElement | undefined;
        g?.setAttribute("opacity", "1");
      }, 200 + b.sum * 45)
    );

    let pg: [number, number] = [6, 4];

    function reorder(sum: number) {
      let ref: Element | null = null;
      for (const k of Array.from(world!.children)) {
        if (k !== player && Number(k.getAttribute("data-sum")) > sum) {
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
    reorder(pg[0] + pg[1]);

    let ringR = 6;
    let ringO = 0.8;
    const ringInterval = window.setInterval(() => {
      ringR += 0.5;
      ringO -= 0.04;
      if (ringR > 16) {
        ringR = 6;
        ringO = 0.8;
      }
      ring!.setAttribute("r", String(ringR));
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
      hud!.textContent = zone + (near ? ` — beside ${near}` : "");
      onNearRef.current?.(near || null);
    }
    updateHud();

    let queue: [number, number][] = [];
    let walking = false;
    let walkRaf = 0;

    function step() {
      if (!queue.length) {
        walking = false;
        updateHud();
        return;
      }
      walking = true;
      const nxt = queue.shift()!;
      const from = cur.slice() as [number, number];
      const to = project(nxt[0], nxt[1]);
      reorder(nxt[0] + nxt[1]);
      const t0 = performance.now();
      function anim(t: number) {
        const u = Math.min((t - t0) / 140, 1);
        placePlayer(from[0] + (to[0] - from[0]) * u, from[1] + (to[1] - from[1]) * u);
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
  }, []);

  return (
    <div {...props}>
      <svg
        ref={svgRef}
        viewBox="0 0 640 320"
        className="block w-full cursor-pointer touch-manipulation"
        role="img"
        aria-label="An isometric data center floor plan viewed from above, with four rack rows, hot and cold aisles, and CRAC units. A marker can be moved with arrow keys, WASD, or by clicking a tile; it paths around racks, and nearby racks reveal their labels."
      >
        <g>
          {TILES.map((t) => (
            <g key={`${t.gx},${t.gy}`}>
              <polygon points={t.points} fill="none" stroke="var(--hw-stroke-soft)" strokeWidth={1} />
              {t.grate.map((g, i) => (
                <line key={i} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke="var(--hw-stroke-soft)" strokeWidth={1} />
              ))}
            </g>
          ))}
        </g>

        <g ref={worldRef}>
          {BOXES.map((b) => (
            <Box key={b.key} data={b} polyRefs={polyRefs} labelRefs={labelRefs} ledRefs={ledRefs} />
          ))}
          <g ref={playerRef} id="dc-player">
            <circle ref={ringRef} cx={0} cy={0} r={6} fill="none" stroke="var(--led-green)" strokeWidth={1} opacity={0} />
            <polygon points="0,-5 9,0 0,5 -9,0" fill="var(--led-green)" stroke="var(--hw-well)" strokeWidth={1} />
          </g>
        </g>

        <g>
          {AISLE_LABELS.map((a, i) => (
            <text key={i} x={a.x} y={a.y} fontSize={11} fill="var(--hw-label-dim)">
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
                rx={2}
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
                fontSize={11}
                fill={b.accent ?? "var(--hw-label)"}
              >
                {b.name}
              </text>
            </g>
          ))}
        </g>
      </svg>

      <div className="flex items-center justify-between px-1 pt-1 font-mono text-xs">
        <span ref={hudRef} className="text-muted-foreground">
          cold aisle — beside r-b06
        </span>
        <span className="text-muted-foreground/40">tap a tile or use arrows / wasd</span>
      </div>
    </div>
  );
}
