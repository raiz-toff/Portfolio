'use client';

import { usePathname } from 'next/navigation';

// Labs section backdrop: a clean PCB "circuit traces" pattern with a soft
// accent glow — one cohesive, consistent design (not random). Contained to a
// top hero band, faded out, and tinted via the section accent.

const MASK = 'radial-gradient(85% 100% at 50% 0%, #000 14%, transparent 72%)';

// A seamless PCB tile (right-angle traces + nodes) that repeats as a fine,
// dense circuit texture. Traces enter/exit the tile edges at fixed points so
// they connect across tiles.
function CircuitTraces() {
  return (
    <svg className="h-full w-full" aria-hidden>
      <defs>
        <pattern id="circuit-tile" width="150" height="150" patternUnits="userSpaceOnUse">
          <g
            stroke="currentColor"
            strokeWidth="1.3"
            fill="none"
            opacity="0.45"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            <polyline points="0,88 52,88 52,56 110,56 110,88 150,88" />
            <polyline points="88,0 88,50 60,50 60,116 88,116 88,150" />
          </g>
          <g fill="currentColor" opacity="0.7">
            <circle cx="52" cy="56" r="2.8" />
            <circle cx="110" cy="88" r="2.8" />
            <circle cx="60" cy="116" r="2.8" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#circuit-tile)" />
    </svg>
  );
}

export function LabsBackground() {
  const pathname = usePathname();
  if (!pathname.startsWith('/docs/labs')) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 h-[58vh]"
      style={{
        zIndex: -1,
        color: 'var(--color-fd-primary)',
        opacity: 0.16,
        maskImage: MASK,
        WebkitMaskImage: MASK,
      }}
    >
      {/* soft glow so the traces sit in light, not on bare black */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 75% at 50% -8%, color-mix(in oklab, currentColor 16%, transparent), transparent 70%)',
        }}
      />
      <CircuitTraces />
    </div>
  );
}
