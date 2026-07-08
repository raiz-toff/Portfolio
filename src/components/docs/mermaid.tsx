'use client';

import { useEffect, useId, useState } from 'react';
import { useTheme } from 'next-themes';

// Renders a Mermaid diagram on the client. Fenced ```mermaid blocks are
// converted to <Mermaid chart="..." /> by the remark plugin in source.config.ts.
export function Mermaid({ chart }: { chart: string }) {
  const id = useId();
  const [svg, setSvg] = useState('');
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        fontFamily: 'inherit',
        theme: resolvedTheme === 'dark' ? 'dark' : 'default',
      });

      try {
        const { svg } = await mermaid.render(
          'mermaid-' + id.replace(/[^a-zA-Z0-9]/g, ''),
          chart,
        );
        if (!cancelled) setSvg(svg);
      } catch (err) {
        if (!cancelled) {
          setSvg(
            `<pre class="text-fd-muted-foreground">Failed to render diagram:\n${
              (err as Error).message
            }</pre>`,
          );
        }
      }
    }

    void render();
    return () => {
      cancelled = true;
    };
  }, [chart, resolvedTheme, id]);

  return (
    <div
      className="my-4 flex justify-center [&_svg]:max-w-full"
      // svg produced by mermaid from trusted, authored diagram source
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
