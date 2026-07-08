import type { ReactNode } from 'react';
import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { SectionTheme } from '@/components/docs/section-theme';
import { LabsBackground } from '@/components/docs/labs-background';

// Per-section accent colours for the sidebar switcher (Labs vs Projects),
// like the coloured section icons on the Fumadocs docs site.
const TAB_COLORS: Record<string, string> = {
  '/docs/labs': '#f59e0b', // amber / gold
  '/docs/projects': '#3b82f6', // blue
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="contents" data-fd-zone>
      <LabsBackground />
      <DocsLayout
        tree={source.getPageTree()}
        {...baseOptions()}
        // Drop the auto-generated "Documentation" fallback tab (the only
        // `unlisted` entry) and give each remaining tab a coloured icon chip.
        tabs={{
          transform(option) {
            if (option.unlisted) return null;
            const color = TAB_COLORS[option.url];
            if (!color) return option;
            return {
              ...option,
              icon: (
                <div
                  className="size-full rounded-md border p-1 [&_svg]:size-full"
                  style={{
                    color,
                    backgroundColor: `${color}1a`,
                    borderColor: `${color}33`,
                  }}
                >
                  {option.icon}
                </div>
              ),
            };
          },
        }}
      >
        <SectionTheme />
        {children}
      </DocsLayout>
    </div>
  );
}
