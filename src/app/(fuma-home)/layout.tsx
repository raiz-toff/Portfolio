import type { ReactNode } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

// Fumadocs top-nav chrome for the docs map (/docs) and the blog. The
// data-fd-zone marker turns on the aurora/grain backdrop (see globals.css)
// without touching portfolio pages; `contents` keeps it out of layout.
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="contents" data-fd-zone>
      <HomeLayout {...baseOptions()}>{children}</HomeLayout>
    </div>
  );
}
