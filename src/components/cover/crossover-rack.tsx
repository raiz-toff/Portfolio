// Candidate D — "the crossover".
// Two patch panels on the diagonal: 568A upper-left (cables exit up, sweep
// left), 568B lower-right (cables exit down, sweep right) — joined by a dark
// fiber run with a service loop, plus a 1U switch uplinked into panel B.
// Pure SVG, no client JS: SMIL sequences the staged reveal (cable bands,
// fiber draw-in via pathLength, the coil, the uplink, then switch LEDs).

const GREEN = "#22c55e";
const ORANGE = "#f97316";
const BLUE = "#3b82f6";
const BROWN = "#9a6b3f";
const WHITE = "#e8e8e8";

type Wire = { color: string; striped: boolean };

// T568A and T568B pinouts, index 0 = pin 1.
const PINS_568A: Wire[] = [
  { color: GREEN, striped: true },
  { color: GREEN, striped: false },
  { color: ORANGE, striped: true },
  { color: BLUE, striped: false },
  { color: BLUE, striped: true },
  { color: ORANGE, striped: false },
  { color: BROWN, striped: true },
  { color: BROWN, striped: false },
];

const PINS_568B: Wire[] = [
  { color: ORANGE, striped: true },
  { color: ORANGE, striped: false },
  { color: GREEN, striped: true },
  { color: BLUE, striped: false },
  { color: BLUE, striped: true },
  { color: GREEN, striped: false },
  { color: BROWN, striped: true },
  { color: BROWN, striped: false },
];

function cxOf(x0: number, i: number) {
  return x0 + i * 19 + (i >= 6 ? 5 : 0) + 7.5;
}

function Ports({
  x0,
  y0,
  notchTop,
}: {
  x0: number;
  y0: number;
  notchTop: boolean;
}) {
  return (
    <>
      {Array.from({ length: 12 }, (_, i) => {
        const x = x0 + i * 19 + (i >= 6 ? 5 : 0);
        return (
          <g key={i}>
            <rect x={x} y={y0} width="15" height="22" rx="2" fill="var(--hw-well)" stroke="var(--hw-stroke)" />
            <rect
              x={x + 4.5}
              y={notchTop ? y0 + 1 : y0 + 18}
              width="6"
              height="3"
              fill="var(--hw-stroke-strong)"
            />
          </g>
        );
      })}
    </>
  );
}

// Band A: 8 cables exiting up from panel A's ports, curving left off-canvas.
const BAND_A = PINS_568A.map((_, j) => {
  const pin = 7 - j;
  const cx = cxOf(60, j + 2);
  const y = 14 + pin * 7;
  const wire = PINS_568A[pin];
  const d = `M ${cx} 108 V ${y + 26} A 26 26 0 0 0 ${cx - 26} ${y} H -4`;
  return { ...wire, j, cx, d, bootY: 104 };
});

// Band B: 8 cables exiting down from panel B's ports, curving right off-canvas.
const BAND_B = PINS_568B.map((_, j) => {
  const pin = 7 - j;
  const cx = cxOf(356, j + 2);
  const y = 336 + pin * 7;
  const wire = PINS_568B[pin];
  const d = `M ${cx} 274 V ${y - 26} A 26 26 0 0 0 ${cx + 26} ${y} H 644`;
  return { ...wire, j, cx, d, bootY: 258 };
});

const SWITCH_LIT = new Set([0, 2, 4, 5, 7]);
const SWITCH_BLINKING = new Set([2, 5]);
const BLINK_VALUES: Record<number, string> = {
  2: "1;0.15;1;1;0.15;1",
  5: "1;1;0.15;1;0.15;1",
};

function CableBand({
  cables,
  baseDelay,
}: {
  cables: (Wire & { j: number; cx: number; d: string; bootY: number })[];
  baseDelay: number;
}) {
  return (
    <>
      {cables.map((cable) => (
        <g key={cable.j} opacity="0">
          <animate
            attributeName="opacity"
            from="0"
            to="1"
            dur="0.01s"
            begin={`${baseDelay + cable.j * 0.1}s`}
            fill="freeze"
          />
          <rect x={cable.cx - 4} y={cable.bootY} width="8" height="17" rx="1.5" fill={cable.color} />
          <path d={cable.d} fill="none" stroke={cable.color} strokeWidth="4" />
          {cable.striped && (
            <path d={cable.d} fill="none" stroke={WHITE} strokeWidth="4" strokeDasharray="4 9" />
          )}
        </g>
      ))}
    </>
  );
}

export default function CrossoverRack(props: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 640 396"
      className="block w-full"
      role="img"
      aria-label="Two patch panels joined by a dark fiber with a service loop: a T568A panel upper-left with cables exiting up and left, a T568B panel lower-right with cables exiting down and right, and a 1U switch uplinked into the lower panel"
      {...props}
    >
      <CableBand cables={BAND_A} baseDelay={0.3} />

      {/* panel A — 568A */}
      <rect x="40" y="112" width="260" height="44" rx="3" fill="var(--hw-face-3)" stroke="var(--hw-stroke)" />
      <circle cx="48" cy="122" r="2.5" fill="var(--hw-well)" stroke="var(--hw-stroke-strong)" />
      <circle cx="48" cy="146" r="2.5" fill="var(--hw-well)" stroke="var(--hw-stroke-strong)" />
      <circle cx="293" cy="122" r="2.5" fill="var(--hw-well)" stroke="var(--hw-stroke-strong)" />
      <circle cx="293" cy="146" r="2.5" fill="var(--hw-well)" stroke="var(--hw-stroke-strong)" />
      <text x="42" y="176" fontSize="11" fill="var(--hw-label)" letterSpacing="1.5">
        T568A
      </text>
      <Ports x0={60} y0={122} notchTop={true} />

      {/* switch — SW-01 */}
      <rect x="420" y="48" width="196" height="32" rx="3" fill="var(--hw-face-3)" stroke="var(--hw-stroke)" />
      <circle cx="428" cy="56" r="2" fill="var(--hw-well)" stroke="var(--hw-stroke-strong)" />
      <circle cx="428" cy="72" r="2" fill="var(--hw-well)" stroke="var(--hw-stroke-strong)" />
      <circle cx="608" cy="56" r="2" fill="var(--hw-well)" stroke="var(--hw-stroke-strong)" />
      <circle cx="608" cy="72" r="2" fill="var(--hw-well)" stroke="var(--hw-stroke-strong)" />
      <text x="438" y="69" fontSize="11" fill="var(--hw-label)" letterSpacing="1">
        SW-01
      </text>
      {/* port row starts clear of the "SW-01" label so the text never clips */}
      {Array.from({ length: 8 }, (_, i) => {
        const x = 482 + i * 15;
        return (
          <g key={i}>
            <rect x={x} y="60" width="11" height="9" rx="1" fill="var(--hw-well)" stroke="var(--hw-stroke)" />
            <circle cx={x + 5.5} cy="55" r="1.7" fill="var(--led-green)" opacity="0">
              {SWITCH_LIT.has(i) && !SWITCH_BLINKING.has(i) && (
                <animate attributeName="opacity" from="0" to="1" dur="0.01s" begin="3.6s" fill="freeze" />
              )}
              {SWITCH_BLINKING.has(i) && (
                <animate
                  attributeName="opacity"
                  values={BLINK_VALUES[i]}
                  dur={i === 2 ? "0.9s" : "1.3s"}
                  begin="3.6s"
                  repeatCount="indefinite"
                />
              )}
            </circle>
          </g>
        );
      })}

      {/* uplink: switch port 7 down into panel B */}
      <g opacity="0">
        <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="2.4s" fill="freeze" />
        <rect x="556" y="78" width="8" height="13" rx="1.5" fill="var(--hw-stroke-strong)" />
        <line x1="560" y1="90" x2="560" y2="226" stroke="var(--hw-cable)" strokeWidth="3" />
        <rect x="556" y="222" width="8" height="12" rx="1.5" fill="var(--hw-stroke-strong)" />
      </g>

      {/* dark fiber, panel A to panel B, with a service loop */}
      <rect x="296" y="129" width="12" height="9" rx="1.5" fill="var(--hw-label)" opacity="0">
        <animate attributeName="opacity" from="0" to="1" dur="0.01s" begin="1.3s" fill="freeze" />
      </rect>
      <path
        d="M 308 134 C 330 134, 346 142, 352 156 C 357 168, 355 186, 362 202 C 369 218, 358 238, 346 250"
        fill="none"
        stroke="var(--hw-cable)"
        strokeWidth="3"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset="1"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="1"
          to="0"
          dur="0.9s"
          begin="1.3s"
          fill="freeze"
          calcMode="spline"
          keySplines="0.22 1 0.36 1"
        />
      </path>
      <circle cx="374" cy="180" r="15" fill="none" stroke="var(--hw-cable)" strokeWidth="3" opacity="0">
        <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="2.2s" fill="freeze" />
      </circle>
      <circle cx="374" cy="180" r="10" fill="none" stroke="var(--hw-cable)" strokeWidth="3" opacity="0">
        <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="2.2s" fill="freeze" />
      </circle>
      <rect x="340" y="248" width="9" height="12" rx="1.5" fill="var(--hw-label)" opacity="0">
        <animate attributeName="opacity" from="0" to="1" dur="0.01s" begin="2.2s" fill="freeze" />
      </rect>
      <text x="404" y="184" fontSize="11" fill="var(--hw-label-dim)" fontStyle="italic" opacity="0">
        dark fiber
        <animate attributeName="opacity" from="0" to="1" dur="0.01s" begin="2.2s" fill="freeze" />
      </text>

      {/* panel B — 568B */}
      <rect x="340" y="232" width="260" height="44" rx="3" fill="var(--hw-face-3)" stroke="var(--hw-stroke)" />
      <circle cx="348" cy="242" r="2.5" fill="var(--hw-well)" stroke="var(--hw-stroke-strong)" />
      <circle cx="348" cy="266" r="2.5" fill="var(--hw-well)" stroke="var(--hw-stroke-strong)" />
      <circle cx="593" cy="242" r="2.5" fill="var(--hw-well)" stroke="var(--hw-stroke-strong)" />
      <circle cx="593" cy="266" r="2.5" fill="var(--hw-well)" stroke="var(--hw-stroke-strong)" />
      <text x="598" y="296" fontSize="11" fill="var(--hw-label)" letterSpacing="1.5" textAnchor="end">
        T568B
      </text>
      <Ports x0={356} y0={242} notchTop={false} />

      <CableBand cables={BAND_B} baseDelay={2.7} />
    </svg>
  );
}
