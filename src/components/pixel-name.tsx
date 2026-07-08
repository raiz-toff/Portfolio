"use client";

// Pixel-block name banner — a faithful port of chanhdai.com's interactive
// logotype (MIT). The wordmark is drawn twice: a faint always-visible stroke
// (so the full name reads at rest) and a fill whose linear gradient's x1
// follows the cursor via a spring, revealing the letters solid as you sweep
// across. The whole thing is clipped at the bottom (translate-y + overflow).

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

const GLYPHS: Record<string, string[]> = {
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};

const ROWS = 7;
const COLS = 5;
const CELL = 10; // one grid unit
const PIXEL = 9; // drawn square (1 unit of gap between cells)
const LETTER_GAP = 1; // empty columns between glyphs

export default function PixelName({
  text = "RAJKUMAR",
  className,
}: {
  text?: string;
  className?: string;
}) {
  const chars = text.toUpperCase().split("");

  const on: { x: number; y: number }[] = [];
  let colOffset = 0;
  for (const ch of chars) {
    const glyph = GLYPHS[ch] ?? GLYPHS[" "];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (glyph[r][c] === "1")
          on.push({ x: (colOffset + c) * CELL, y: r * CELL });
      }
    }
    colOffset += COLS + LETTER_GAP;
  }

  const totalCols = colOffset - LETTER_GAP;
  const width = totalCols * CELL;
  const height = ROWS * CELL;

  // cursor-following gradient position, smoothed by a spring (chanhdai's values)
  const shouldReduceMotion = useReducedMotion();
  const gradientX1Raw = useMotionValue(0.5);
  const gradientX1 = useSpring(useTransform(gradientX1Raw, [0, 1], [0, width]), {
    stiffness: 150,
    damping: 25,
  });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    gradientX1Raw.set((event.clientX - rect.left) / rect.width);
  };

  const handleMouseLeave = () => {
    if (shouldReduceMotion) return;
    gradientX1Raw.set(0.5);
  };

  return (
    <div
      className={`screen-line-top after:z-1 ${className ?? ""}`}
    >
      <div
        className="overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex w-full translate-y-[12%] items-center justify-center">
          <svg
            role="img"
            aria-label={text}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            fill="none"
            style={{ width: "100%", height: "auto", display: "block" }}
          >
            {/* fill: revealed by the cursor-following gradient */}
            <g fill="url(#pixel-name-grad)">
              {on.map((p, i) => (
                <rect key={i} x={p.x} y={p.y} width={PIXEL} height={PIXEL} />
              ))}
            </g>

            {/* always-visible faint outline: the full name reads at rest */}
            <g
              className="stroke-foreground/15"
              fill="none"
              strokeWidth={1.25}
            >
              {on.map((p, i) => (
                <rect
                  key={i}
                  x={p.x}
                  y={p.y}
                  width={PIXEL}
                  height={PIXEL}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>

            <defs>
              <motion.linearGradient
                id="pixel-name-grad"
                x1={gradientX1}
                y1={1}
                x2={width / 2}
                y2={height}
                gradientUnits="userSpaceOnUse"
              >
                <stop
                  offset="0.625"
                  stopColor="var(--foreground)"
                  stopOpacity="0"
                />
                <stop offset="1" stopColor="var(--foreground)" />
              </motion.linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}
