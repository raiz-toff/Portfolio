// Candidate A — "the bench, isometric".
// A from-scratch isometric wireframe of the lab: hypervisor slab, VM blocks,
// circuit traces running off-canvas, one packet on the move. Pure SVG,
// theme-aware via CSS vars, no client JS (SMIL handles the packet).

type P = [number, number];

// 2:1-ish isometric projection.
const iso = (x: number, y: number, z: number): P => [
  (x - y) * 0.866,
  (x + y) * 0.5 - z,
];

const pts = (list: P[]) => list.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");

// Visible faces of an axis-aligned box sitting at (x, y, z).
function box(x: number, y: number, z: number, w: number, d: number, h: number) {
  const top = pts([
    iso(x, y, z + h),
    iso(x + w, y, z + h),
    iso(x + w, y + d, z + h),
    iso(x, y + d, z + h),
  ]);
  const right = pts([
    iso(x + w, y, z + h),
    iso(x + w, y + d, z + h),
    iso(x + w, y + d, z),
    iso(x + w, y, z),
  ]);
  const front = pts([
    iso(x, y + d, z + h),
    iso(x + w, y + d, z + h),
    iso(x + w, y + d, z),
    iso(x, y + d, z),
  ]);
  return { top, right, front };
}

function IsoBox({
  x,
  y,
  z,
  w,
  d,
  h,
  hatchTop = false,
  wireframe = false,
}: {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  hatchTop?: boolean;
  wireframe?: boolean;
}) {
  const f = box(x, y, z, w, d, h);
  if (wireframe) {
    return (
      <g fill="none" stroke="var(--border)" strokeDasharray="3 3">
        <polygon points={f.top} />
        <polygon points={f.right} />
        <polygon points={f.front} />
      </g>
    );
  }
  return (
    <g stroke="var(--ring)" strokeWidth="1" strokeLinejoin="round">
      <polygon points={f.front} fill="var(--muted)" />
      <polygon points={f.right} fill="var(--background)" />
      <polygon points={f.top} fill="var(--background)" />
      {hatchTop && <polygon points={f.top} fill="url(#iso-hatch)" stroke="none" />}
    </g>
  );
}

// A dashed trace along the ground plane (z = 0).
function tracePath(points: [number, number][]) {
  return points
    .map(([x, y], i) => {
      const [sx, sy] = iso(x, y, 0);
      return `${i === 0 ? "M" : "L"} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
    })
    .join(" ");
}

const TRACES: [number, number][][] = [
  // from the slab's right edge, running off to the lower right
  [
    [150, 20],
    [320, 20],
    [320, 140],
    [560, 140],
  ],
  // from the slab's front edge, off to the lower left
  [
    [40, 130],
    [40, 300],
    [-140, 300],
    [-140, 460],
  ],
  // thin service lane heading up-right
  [
    [110, -110],
    [110, -320],
  ],
  // lane to the left horizon
  [
    [-130, 60],
    [-360, 60],
    [-360, -80],
  ],
];

export default function IsoLab() {
  return (
    <svg
      viewBox="0 0 900 320"
      className="block w-full"
      role="img"
      aria-label="Isometric illustration of a home lab: a hypervisor slab carrying virtual machine blocks, connected by circuit traces"
    >
      <defs>
        <pattern id="iso-hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="7" stroke="var(--line)" strokeWidth="2" />
        </pattern>
      </defs>

      <g transform="translate(450 175)">
        {/* ground traces first, so everything sits on top */}
        <g fill="none" stroke="var(--border)">
          {TRACES.map((t, i) => (
            <path key={i} d={tracePath(t)} strokeDasharray="4 4" />
          ))}
        </g>

        {/* packets riding two of the traces */}
        <circle r="2.5" opacity="0" className="packet">
          <animateMotion dur="5s" begin="0.4s" repeatCount="indefinite" path={tracePath(TRACES[0])} />
          <set attributeName="opacity" to="1" begin="0.4s" />
        </circle>
        <circle r="2.5" opacity="0" className="packet-return">
          <animateMotion dur="6.5s" begin="2s" repeatCount="indefinite" path={tracePath(TRACES[1])} />
          <set attributeName="opacity" to="1" begin="2s" />
        </circle>

        {/* background wireframes — unbuilt zones */}
        <IsoBox x={-320} y={-190} z={0} w={90} d={90} h={44} wireframe />
        <IsoBox x={190} y={-230} z={0} w={70} d={70} h={110} wireframe />

        {/* the hypervisor slab */}
        <IsoBox x={-130} y={-110} z={0} w={280} d={240} h={16} hatchTop />

        {/* VM blocks on the slab */}
        <IsoBox x={-100} y={-80} z={16} w={80} d={80} h={52} />
        <IsoBox x={10} y={-90} z={16} w={64} d={64} h={84} />
        <IsoBox x={-70} y={30} z={16} w={110} d={70} h={30} hatchTop />
        <IsoBox x={62} y={10} z={16} w={50} d={50} h={40} />

        {/* labels with leader ticks */}
        <g className="font-mono" fontSize="9" fill="var(--muted-foreground)">
          <text x={iso(-130, 140, 0)[0] - 6} y={iso(-130, 140, 0)[1] + 14}>
            pve-01 // type-1
          </text>
          <text x={iso(74, -90, 100)[0] + 10} y={iso(74, -90, 100)[1] - 6}>
            eve-ng
          </text>
          <text x={iso(-100, -80, 68)[0] - 52} y={iso(-100, -80, 68)[1] - 10}>
            cml
          </text>
          <text x={iso(-70, 100, 46)[0] - 66} y={iso(-70, 100, 46)[1] + 4}>
            gitlab
          </text>
        </g>
      </g>
    </svg>
  );
}
