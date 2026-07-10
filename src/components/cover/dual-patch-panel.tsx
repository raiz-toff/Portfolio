// Candidate C — "the cross-connect".
// A copy of the single patch panel (patch-panel.tsx), split into two: 568A on
// the left, 568B on the right, joined by a dark-fiber trunk across the gap.
// 568A's cables exit above the plate and sweep left; 568B's exit below and
// sweep right — each panel is the exact same local geometry as the single
// candidate, just reflected through a group transform (vertical flip for
// "exits above", horizontal flip for "sweeps right"). Pure SVG, no client JS.

const PORT_COUNT = 24;
const PORT_W = 16;
const PORT_H = 22;
const PORT_TOP = 54;
const PANEL_TOP = 44;
const PANEL_H = 44;

function portX(i: number) {
  return 64 + i * 20 + Math.floor(i / 6) * 6;
}

type Wire = { color: string; striped: boolean };

// T568B: pins 1–8 = o/w, o, g/w, b, b/w, g, br/w, br.
const WIRES_568B: Wire[] = [
  { color: "#f97316", striped: true },
  { color: "#f97316", striped: false },
  { color: "#22c55e", striped: true },
  { color: "#3b82f6", striped: false },
  { color: "#3b82f6", striped: true },
  { color: "#22c55e", striped: false },
  { color: "#9a6b3f", striped: true },
  { color: "#9a6b3f", striped: false },
];

// T568A: same as 568B but the orange and green pairs swap (pins 1,2,3,6).
const WIRES_568A: Wire[] = [
  { color: "#22c55e", striped: true },
  { color: "#22c55e", striped: false },
  { color: "#f97316", striped: true },
  { color: "#3b82f6", striped: false },
  { color: "#3b82f6", striped: true },
  { color: "#f97316", striped: false },
  { color: "#9a6b3f", striped: true },
  { color: "#9a6b3f", striped: false },
];

const BLINKING = new Set([1, 4, 6]);
const BLINK_VALUES = ["1;0.2;1;1;0.2;1", "1;1;0.2;1;0.2;1", "1;0.2;1;0.3;1;1"];

const PORTS = Array.from({ length: PORT_COUNT }, (_, i) => portX(i));
const CABLE_START = 8;

// One panel's worth of art, drawn in the same local coordinate system as the
// single-panel candidate (bottom-exit, left-sweep). The caller reflects this
// through a transform to get the other three orientations for free.
function PanelArt({ wires, blinkStart }: { wires: Wire[]; blinkStart: number }) {
  const cables = wires.map((wire, k) => {
    const portIndex = CABLE_START + k;
    const cx = portX(portIndex) + 8;
    const landingY = 150 + k * 7;
    const path = `M ${cx} 80 V ${landingY - 26} A 26 26 0 0 1 ${cx - 26} ${landingY} H -4`;
    return { ...wire, k, cx, path };
  });

  return (
    <>
      <rect
        x="24"
        y={PANEL_TOP}
        width="592"
        height={PANEL_H}
        rx="4"
        fill="var(--hw-face-3)"
        stroke="var(--hw-stroke)"
      />
      <circle cx="34" cy="54" r="2.5" fill="var(--hw-well)" stroke="var(--hw-stroke-strong)" />
      <circle cx="34" cy="78" r="2.5" fill="var(--hw-well)" stroke="var(--hw-stroke-strong)" />
      <circle cx="606" cy="54" r="2.5" fill="var(--hw-well)" stroke="var(--hw-stroke-strong)" />
      <circle cx="606" cy="78" r="2.5" fill="var(--hw-well)" stroke="var(--hw-stroke-strong)" />

      {PORTS.map((x, i) => (
        <g key={i}>
          <rect
            x={x}
            y={PORT_TOP}
            width={PORT_W}
            height={PORT_H}
            rx="2.5"
            fill="var(--hw-well)"
            stroke="var(--hw-stroke)"
          />
          <rect x={x + 5} y={PORT_TOP + 17} width="6" height="3.5" fill="var(--hw-stroke-strong)" />
        </g>
      ))}

      {cables.map((cable) => (
        <g key={cable.k}>
          <g opacity="0">
            <animate
              attributeName="opacity"
              from="0"
              to="1"
              dur="0.01s"
              begin={`${0.3 + cable.k * 0.11}s`}
              fill="freeze"
            />
            <rect
              x={cable.cx - 4}
              y="66"
              width="8"
              height="15"
              rx="1.5"
              fill={cable.color}
            />
            <path d={cable.path} fill="none" stroke={cable.color} strokeWidth="4" />
            {cable.striped && (
              <path
                d={cable.path}
                fill="none"
                stroke="#e8e8e8"
                strokeWidth="4"
                strokeDasharray="4 9"
              />
            )}
          </g>

          <circle cx={cable.cx} cy="49.5" r="2" fill="var(--led-green)">
            {BLINKING.has(cable.k) && (
              <animate
                attributeName="opacity"
                values={BLINK_VALUES[cable.k % BLINK_VALUES.length]}
                dur={`${1.3 + (cable.k % 3) * 0.35}s`}
                begin={`${blinkStart + cable.k * 0.2}s`}
                repeatCount="indefinite"
              />
            )}
          </circle>
        </g>
      ))}
    </>
  );
}

export default function DualPatchPanel(props: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 1300 460"
      className="block w-full"
      role="img"
      aria-label="Two patch panels joined by a dark fiber trunk: a T568A panel on the left with cables exiting above and sweeping left, and a T568B panel on the right with cables exiting below and sweeping right"
      {...props}
    >
      {/* background: dashed rack rails around each panel + an unbuilt 1U per
          rack (below the near end, above the far end) — the bench scene's
          wireframe language. Stroke/dash doubled: this viewBox is ~2× the
          other scenes, so these values render at the same visual rhythm. */}
      <g fill="none" strokeWidth="2">
        <line x1="14" y1="30" x2="14" y2="430" stroke="var(--hw-stroke-soft)" strokeDasharray="6 6" />
        <line x1="626" y1="30" x2="626" y2="430" stroke="var(--hw-stroke-soft)" strokeDasharray="6 6" />
        <line x1="674" y1="30" x2="674" y2="430" stroke="var(--hw-stroke-soft)" strokeDasharray="6 6" />
        <line x1="1286" y1="30" x2="1286" y2="430" stroke="var(--hw-stroke-soft)" strokeDasharray="6 6" />
        <rect x="24" y="264" width="592" height="44" rx="4" stroke="var(--border)" strokeDasharray="6 6" />
        <rect x="684" y="152" width="592" height="44" rx="4" stroke="var(--border)" strokeDasharray="6 6" />
      </g>

      {/* 568A, left: vertical flip only — cables exit above, still sweep left */}
      <g transform="translate(0,296) scale(1,-1)">
        <PanelArt wires={WIRES_568A} blinkStart={1.6} />
      </g>

      {/* 568B, right: horizontal flip only — stays bottom-exit, sweeps right */}
      <g transform="translate(1300,164) scale(-1,1)">
        <PanelArt wires={WIRES_568B} blinkStart={2.0} />
      </g>

      {/* dark fiber trunk, joining the two panels across the gap */}
      <rect x="609" y="222" width="10" height="16" rx="2" fill="var(--hw-well)" stroke="var(--hw-stroke-strong)" />
      <rect x="681" y="222" width="10" height="16" rx="2" fill="var(--hw-well)" stroke="var(--hw-stroke-strong)" />
      <path
        d="M 619 230 Q 650 248 681 230"
        fill="none"
        stroke="var(--hw-cable)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M 619 230 Q 650 248 681 230"
        fill="none"
        stroke="var(--hw-stroke-strong)"
        strokeWidth="1.5"
        strokeDasharray="1 5"
        strokeLinecap="round"
      />

      <text x="608" y="246" className="font-mono" fontSize="11" fill="var(--hw-label)" textAnchor="end" letterSpacing="1.5">
        568A
      </text>
      <text x="1268" y="214" className="font-mono" fontSize="11" fill="var(--hw-label)" textAnchor="end" letterSpacing="1.5">
        568B
      </text>
    </svg>
  );
}
