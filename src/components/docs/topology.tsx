'use client';

import { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, ExternalLink, Waypoints } from 'lucide-react';
import { cn } from '@/lib/cn';

// Interactive network topology embed. The diagrams are self-contained HTML
// files under /public/projects/network-map/, referenced by the `topology`
// frontmatter (or used inline via <Topology src="..." />).
export function Topology({
  src,
  title = 'Interactive Topology',
  height = 560,
}: {
  src: string;
  title?: string;
  height?: number;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  // The iframe can finish loading before React hydrates and attaches onLoad, in
  // which case that event is lost and the overlay would hang forever. Catch the
  // already-loaded case on mount. (Same-origin, so contentDocument is readable;
  // the about:blank guard avoids matching the placeholder document.)
  useEffect(() => {
    const doc = frameRef.current?.contentDocument;
    if (doc && doc.readyState === 'complete' && doc.location.href !== 'about:blank') {
      setLoaded(true);
    }
  }, []);

  return (
    <figure
      className={cn(
        'not-prose my-6 flex flex-col overflow-hidden rounded-xl border border-fd-border bg-fd-card shadow-sm',
        fullscreen && 'fixed inset-3 z-50 my-0 shadow-2xl',
      )}
    >
      {/* header bar */}
      <div className="flex items-center gap-2 border-b border-fd-border bg-fd-muted/40 px-3 py-2">
        <Waypoints className="size-4 shrink-0 text-fd-primary" />
        <span className="truncate text-sm font-medium text-fd-foreground">{title}</span>
        <span className="ml-1 rounded-full border border-fd-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-fd-muted-foreground">
          Interactive
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFullscreen((v) => !v)}
            aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className="inline-flex size-7 items-center justify-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
          >
            {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
          <a
            href={src}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Open topology in a new tab"
            className="inline-flex size-7 items-center justify-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
          >
            <ExternalLink className="size-4" />
          </a>
        </div>
      </div>

      {/* diagram */}
      <div className="relative flex-1 bg-fd-background">
        {!loaded && (
          // pointer-events-none: never let the placeholder swallow pans/clicks
          // meant for the diagram underneath it.
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-fd-muted-foreground">
            Loading topology…
          </div>
        )}
        <iframe
          ref={frameRef}
          src={src}
          title={title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className="block w-full border-0"
          style={{ height: fullscreen ? '100%' : height }}
        />
      </div>
    </figure>
  );
}
