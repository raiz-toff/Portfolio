import type { ReactNode } from 'react';

// Blog accent (violet) — /blog is outside /docs, so SectionTheme doesn't
// apply here; inject the same server-rendered override instead.
const CSS =
  ':root{--color-fd-primary:#7c3aed;--color-fd-ring:#7c3aed}' +
  ':root.dark{--color-fd-primary:#a78bfa;--color-fd-ring:#a78bfa}';

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {children}
    </>
  );
}
