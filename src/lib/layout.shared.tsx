import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // The wordmark links to the docs map, not the portfolio home — the
      // "Home" nav link below covers that.
      url: '/docs',
      // JSX supported — RN network mark + wordmark lockup.
      // The mark is painted via a CSS mask so it inherits the live section
      // accent (`--color-fd-primary`): gold on Labs, blue on Projects, etc.
      title: (
        <>
          <span
            aria-hidden="true"
            className="size-[26px] shrink-0"
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
          <span className="font-semibold tracking-tight">{appName}</span>
        </>
      ),
    },
    // Top-nav links (the blog lives outside the docs sidebar, like fumadocs.dev)
    links: [
      { text: 'Home', url: '/' },
      { text: 'Docs', url: '/docs' },
      { text: 'Blog', url: '/blog' },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
