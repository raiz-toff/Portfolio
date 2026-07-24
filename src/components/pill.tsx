// Icon button that expands on hover/focus to reveal its label — the label is
// the call-to-action, surfacing exactly when a visitor reaches for the button.
// Icon-only and the same 32px-square footprint at rest.
//
// The reveal is pure CSS: the label sits in a grid whose single column animates
// from 0fr → 1fr, growing its width from nothing to its content. overflow-hidden
// lives on the INNER wrapper (not the button) so the button keeps its extended
// `after:-inset-1` hit target and an unclipped focus ring. Under
// prefers-reduced-motion the grid still switches, so the label snaps in instantly
// instead of sliding — the CTA never gets lost.

export const pillClass =
  "group/pill relative inline-flex h-8 items-center rounded-lg border bg-background text-foreground/80 transition-[background-color,color,border-color,scale] duration-200 ease-out after:absolute after:-inset-1 after:content-[''] hover:border-foreground/20 hover:bg-muted hover:text-foreground focus-visible:text-foreground active:scale-[0.97]";

export function PillIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center [&_svg]:size-4">
      {children}
    </span>
  );
}

export function PillLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid grid-cols-[0fr] transition-[grid-template-columns] duration-300 ease-out group-hover/pill:grid-cols-[1fr] group-focus-visible/pill:grid-cols-[1fr]">
      <span className="overflow-hidden">
        <span className="flex items-baseline gap-1.5 whitespace-nowrap pr-2.5 text-sm font-medium">
          {children}
        </span>
      </span>
    </span>
  );
}

// The link's real destination, shown alongside the name in monospace — reads
// like a verified address, so a visitor sees where a button goes before clicking.
export function PillHandle({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-xs font-normal text-muted-foreground">
      {children}
    </span>
  );
}
