'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FlaskConical, Boxes, Network, Feather, ArrowUpRight } from 'lucide-react';

// Landing-page hero: the documentation drawn as a network topology. The RN
// core routes to one device chassis per section over right-angle PCB traces
// (same visual language as the Labs circuit backdrop). Hovering a segment
// re-tints the whole site via `--color-fd-primary` — the same mechanism
// SectionTheme uses inside /docs — so the landing page demos the site's own
// per-section theming. Honours prefers-reduced-motion (packets hidden).

export type Segment = {
  slug: string;
  title: string;
  href: string;
  /** published doc count — real data, computed server-side */
  count: number;
  /** section accents, mirrors SECTION_THEME in section-theme.tsx */
  light: string;
  dark: string;
  iface: string;
  blurb: string;
  status: 'up' | 'admin-down';
  icon: 'flask' | 'boxes' | 'network' | 'feather';
};

const ICONS = {
  flask: FlaskConical,
  boxes: Boxes,
  network: Network,
  feather: Feather,
} as const;

// Trace geometry: core mid-left at y=200, one row per segment at
// y=50/150/250/350. preserveAspectRatio="none" + right angles only, so the
// traces stretch with the column while staying orthogonal; non-scaling-stroke
// keeps them hairline.
const TRACE_D = [
  'M0 200 H32 V50 H140',
  'M0 200 H32 V150 H140',
  'M0 200 H32 V250 H140',
  'M0 200 H32 V350 H140',
];

function segVars(s: Segment) {
  return { '--seg-light': s.light, '--seg-dark': s.dark } as React.CSSProperties;
}

function Chassis({
  seg,
  onHover,
}: {
  seg: Segment;
  onHover: (slug: string | null) => void;
}) {
  const Icon = ICONS[seg.icon];
  const down = seg.status === 'admin-down';

  const body = (
    <>
      {/* connector pin where the trace meets the chassis */}
      <span
        aria-hidden
        className="absolute -left-[5px] top-1/2 hidden size-2.5 -translate-y-1/2 border bg-fd-background md:block"
        style={{ borderColor: 'color-mix(in oklab, var(--seg) 55%, var(--color-fd-border))' }}
      />
      {/* icon chip — same treatment as the sidebar tab chips */}
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-md border"
        style={{
          color: down ? 'var(--color-fd-muted-foreground)' : 'var(--seg)',
          backgroundColor: down
            ? 'transparent'
            : 'color-mix(in oklab, var(--seg) 10%, transparent)',
          borderColor: down
            ? 'var(--color-fd-border)'
            : 'color-mix(in oklab, var(--seg) 25%, var(--color-fd-border))',
        }}
      >
        <Icon className="size-4.5" strokeWidth={1.8} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="truncate text-[15px] font-semibold tracking-tight text-fd-foreground">
            {seg.title}
          </span>
          <span className="font-mono text-[10px] tracking-wide text-fd-muted-foreground">
            {seg.iface}
          </span>
        </span>
        <span className="mt-0.5 line-clamp-2 text-[12.5px] text-fd-muted-foreground md:truncate">
          {seg.blurb}
        </span>
      </span>

      {/* status + count, show ip int brief style */}
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-fd-muted-foreground">
          <span
            aria-hidden
            className={down ? 'size-1.5 rounded-full bg-fd-border' : 'size-1.5 rounded-full motion-safe:animate-pulse'}
            style={down ? undefined : { backgroundColor: 'var(--seg)', animationDuration: '2.4s' }}
          />
          {down ? 'admin down' : 'up'}
        </span>
        {down ? (
          <span className="font-mono text-[11px] text-fd-muted-foreground/70">provisioning</span>
        ) : (
          <span className="flex items-center gap-1 font-mono text-[11px] text-fd-muted-foreground">
            {seg.count} docs
            <ArrowUpRight className="size-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </span>
        )}
      </span>
    </>
  );

  const base =
    'seg-node group relative flex w-full min-w-0 items-center gap-3.5 rounded-xl border px-4 py-3.5 transition-[translate,scale,box-shadow,border-color] duration-200';

  if (down) {
    return (
      <div
        className={`${base} border-dashed border-fd-border bg-fd-card/40 opacity-60`}
        style={segVars(seg)}
        aria-label={`${seg.title} — coming soon`}
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      href={seg.href}
      className={`${base} border-fd-border bg-fd-card/70 backdrop-blur-sm hover:-translate-y-px hover:shadow-md active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring`}
      style={{
        ...segVars(seg),
        ['--hover-border' as string]: 'color-mix(in oklab, var(--seg) 45%, var(--color-fd-border))',
      }}
      onMouseEnter={() => onHover(seg.slug)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(seg.slug)}
      onBlur={() => onHover(null)}
    >
      {body}
    </Link>
  );
}

export function HomeTopology({ segments }: { segments: Segment[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  // Re-tint the site accent while a segment is hovered/focused — inline vars
  // on <html> override the stylesheet defaults, removed on leave.
  useEffect(() => {
    if (!hovered) return;
    const seg = segments.find((s) => s.slug === hovered);
    if (!seg) return;
    const isDark = document.documentElement.classList.contains('dark');
    const color = isDark ? seg.dark : seg.light;
    const root = document.documentElement.style;
    root.setProperty('--color-fd-primary', color);
    root.setProperty('--color-fd-ring', color);
    return () => {
      root.removeProperty('--color-fd-primary');
      root.removeProperty('--color-fd-ring');
    };
  }, [hovered, segments]);

  return (
    <div aria-label="Documentation map" className="flex w-full items-center">
      {/* core router — routes to the portfolio home (the person behind the AS) */}
      <Link
        href="/"
        aria-label="Rajkumar Neupane — portfolio home"
        title="Home"
        className="group/core hidden shrink-0 flex-col items-center gap-2 rounded-xl border border-fd-border bg-fd-card/70 px-4 py-5 backdrop-blur-sm transition-[translate,scale,box-shadow,border-color] duration-200 hover:-translate-y-px hover:border-fd-primary/50 hover:shadow-md active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring md:flex"
      >
        <span
          aria-hidden
          className="size-12"
          style={{
            backgroundColor: 'var(--color-fd-primary)',
            WebkitMaskImage: 'url(/logo.svg)',
            maskImage: 'url(/logo.svg)',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            transition: 'background-color 0.3s ease',
          }}
        />
        <span className="font-mono text-[10px] uppercase tracking-wider text-fd-muted-foreground transition-colors group-hover/core:text-fd-primary">
          rn0 · core
        </span>
      </Link>

      {/* traces */}
      <svg
        aria-hidden
        viewBox="0 0 140 400"
        preserveAspectRatio="none"
        className="hidden h-[400px] w-16 shrink-0 md:block lg:w-24"
      >
        {segments.map((seg, i) => {
          const active = hovered === seg.slug;
          const down = seg.status === 'admin-down';
          return (
            <g key={seg.slug} className="seg-node" style={segVars(seg)}>
              <path
                d={TRACE_D[i]}
                fill="none"
                vectorEffect="non-scaling-stroke"
                strokeWidth={active ? 2 : 1.5}
                strokeDasharray={down ? '3 5' : undefined}
                stroke={
                  active
                    ? 'var(--seg)'
                    : 'color-mix(in oklab, var(--color-fd-foreground) 18%, transparent)'
                }
                style={{
                  transition: 'stroke 0.25s ease',
                  filter: active ? 'drop-shadow(0 0 3px var(--seg))' : undefined,
                }}
              />
              {!down && (
                <circle
                  r="2.5"
                  fill="var(--seg)"
                  className="motion-reduce:hidden"
                  opacity="0.9"
                >
                  <animateMotion
                    dur={active ? '1.6s' : '5.5s'}
                    begin={`${i * 1.8}s`}
                    repeatCount="indefinite"
                    path={TRACE_D[i]}
                  />
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      {/* device chassis */}
      <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:h-[400px] md:grid-rows-4 md:items-center md:gap-0">
        {segments.map((seg) => (
          <Chassis key={seg.slug} seg={seg} onHover={setHovered} />
        ))}
      </div>
    </div>
  );
}
