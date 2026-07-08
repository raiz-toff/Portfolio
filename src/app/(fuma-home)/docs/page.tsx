import type { Metadata } from 'next';
import { source } from '@/lib/source';
import { blog } from '@/lib/blog';
import { HomeTopology, type Segment } from '@/components/docs/home-topology';
import SiteFooter from '@/components/site-footer';

// Docs entry (/docs) — the documentation drawn as a network topology. Counts
// are computed from the published (non-draft) source so the map never lies.
export const metadata: Metadata = {
  title: 'Docs',
  description:
    'Hands-on network labs and software builds, written up from the homelab as they happen — configs, topologies, and the reasoning behind them.',
  alternates: { canonical: '/docs' },
};

export default function DocsIndexPage() {
  const pages = source.getPages();
  const count = (slug: string) => pages.filter((p) => p.slugs[0] === slug).length;

  const segments: Segment[] = [
    {
      slug: 'labs',
      title: 'Labs',
      href: '/docs/labs',
      count: count('labs'),
      // mirrors SECTION_THEME (amber / gold)
      light: '#b45309',
      dark: '#fbbf24',
      iface: 'gi0/0',
      blurb: 'Networking builds & automation',
      status: 'up',
      icon: 'flask',
    },
    {
      slug: 'projects',
      title: 'Projects',
      href: '/docs/projects',
      count: count('projects'),
      // mirrors SECTION_THEME (blue)
      light: '#2563eb',
      dark: '#60a5fa',
      iface: 'gi0/1',
      blurb: 'Software & hardware write-ups',
      status: 'up',
      icon: 'boxes',
    },
    {
      slug: 'blog',
      title: 'Blog',
      href: '/blog',
      count: blog.getPages().length,
      // mirrors the accent in app/(home)/blog/layout.tsx (violet)
      light: '#7c3aed',
      dark: '#a78bfa',
      iface: 'gi0/2',
      blurb: 'Stories & field notes',
      status: 'up',
      icon: 'feather',
    },
    {
      slug: 'ccna-labs',
      title: 'CCNA Labs',
      href: '/docs/ccna-labs',
      count: count('ccna-labs'),
      light: '#0e7490',
      dark: '#2dd4bf',
      iface: 'gi0/3',
      blurb: 'Cisco 200-301 series',
      status: 'admin-down',
      icon: 'network',
    },
  ];

  const live = segments.filter((s) => s.status === 'up');
  const totalDocs = live.reduce((n, s) => n + s.count, 0);
  const provisioning = segments.length - live.length;

  return (
    <>
      <main className="flex flex-1 flex-col justify-center px-6 py-16">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
          {/* copy */}
          <div>
            <p className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-fd-muted-foreground">
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-fd-primary motion-safe:animate-pulse"
                style={{ animationDuration: '2.4s' }}
              />
              AS 64512 · documentation network
            </p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-fd-foreground sm:text-5xl">
              The network keeps notes.
            </h1>
            <p className="mt-5 max-w-md text-pretty text-[15px] leading-relaxed text-fd-muted-foreground">
              Hands-on network labs and software builds, written up from the
              homelab as they happen — configs, topologies, and the reasoning
              behind them.
            </p>
            <p className="mt-8 font-mono text-[11px] tracking-wide text-fd-muted-foreground/80">
              {live.length} segments up · {totalDocs} docs
              {provisioning > 0 ? ` · ${provisioning} provisioning` : ''}
            </p>
          </div>

          {/* the map */}
          <div>
            <HomeTopology segments={segments} />
            <p className="mt-5 text-center font-mono text-[10px] tracking-wider text-fd-muted-foreground/60 md:pl-2 md:text-left">
              fig. 01 — this site, as a topology
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
