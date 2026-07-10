// Candidate B — "the patch panel".
// A 24-port patch panel with 8 cables in real T568B color/stripe order
// (pins 1–8: o/w-o, g/w-b, b/w-g, br/w-br) curving off into a parallel band.
// Pure SVG, no client JS — SMIL handles the cable fade-in and LED blink.

const PORT_COUNT = 24;
const PORT_W = 16;
const PORT_H = 22;
const PORT_TOP = 54;
const PANEL_TOP = 44;
const PANEL_H = 44;

// x-position of port i: even spacing, with a small gutter every 6 ports
// (mirrors how physical patch panels group ports in blocks of six).
function portX(i: number) {
  return 64 + i * 20 + Math.floor(i / 6) * 6;
}

// T568B pinout, pins 1–8. `striped` pairs render a white candy-cane overlay.
const WIRES: { color: string; striped: boolean }[] = [
  { color: "#f97316", striped: true }, // 1 orange-white
  { color: "#f97316", striped: false }, // 2 orange
  { color: "#22c55e", striped: true }, // 3 green-white
  { color: "#3b82f6", striped: false }, // 4 blue
  { color: "#3b82f6", striped: true }, // 5 blue-white
  { color: "#22c55e", striped: false }, // 6 green
  { color: "#9a6b3f", striped: true }, // 7 brown-white
  { color: "#9a6b3f", striped: false }, // 8 brown
];

// Which cables (0-indexed within WIRES) carry a blinking activity LED —
// matches the original design's uneven, "some ports are busy" rhythm.
const BLINKING = new Set([1, 4, 6]);
const BLINK_VALUES = ["1;0.2;1;1;0.2;1", "1;1;0.2;1;0.2;1", "1;0.2;1;0.3;1;1"];

const PORTS = Array.from({ length: PORT_COUNT }, (_, i) => portX(i));

const CABLE_START = 8; // cables land on the middle 8 ports
const CABLES = WIRES.map((wire, k) => {
  const portIndex = CABLE_START + k;
  const cx = portX(portIndex) + 8;
  const landingY = 150 + k * 7;
  const path = `M ${cx} 80 V ${landingY - 26} A 26 26 0 0 1 ${cx - 26} ${landingY} H -4`;
  return { ...wire, k, cx, path };
});

export default function PatchPanel(props: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 640 214"
      className="block w-full"
      role="img"
      aria-label="24-port patch panel with eight cables in T568B color order curving off into a parallel band"
      {...props}
    >
      {/* background: dashed rack rails, an unbuilt 1U above, and a future
          run sweeping off-canvas — the bench scene's wireframe language */}
      <g fill="none">
        <line x1="14" y1="0" x2="14" y2="214" stroke="var(--hw-stroke-soft)" strokeDasharray="3 3" />
        <line x1="626" y1="0" x2="626" y2="214" stroke="var(--hw-stroke-soft)" strokeDasharray="3 3" />
        <rect x="24" y="8" width="592" height="28" rx="4" stroke="var(--border)" strokeDasharray="3 3" />
        <path d="M 550 80 V 124 A 26 26 0 0 0 576 150 H 648" stroke="var(--border)" strokeDasharray="4 4" />
      </g>

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
      <text
        x="596"
        y="82"
        className="font-mono"
        fontSize="11"
        fill="var(--hw-label)"
        textAnchor="end"
        letterSpacing="1.5"
      >
        T568B
      </text>

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

      {CABLES.map((cable) => (
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
                begin={`${1.6 + cable.k * 0.2}s`}
                repeatCount="indefinite"
              />
            )}
          </circle>
        </g>
      ))}
    </svg>
  );
}
