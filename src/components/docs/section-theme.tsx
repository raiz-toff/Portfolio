'use client';

import { usePathname } from 'next/navigation';

// Re-tints the whole site's accent (`--color-fd-primary`) based on the active
// section. On Labs it also hides the global aurora/grain backdrop, because the
// Labs section has its own random themed backdrop (see labs-background.tsx) —
// so only one background shows at a time. Injected as a <style> so it is
// server-rendered (no flash) and updates live on navigation.
const SECTION_THEME: Record<
  string,
  { light: string; dark: string; hideBase?: boolean }
> = {
  // Labs has its own circuit-traces backdrop, so hide the global aurora/grain
  // there — only one background shows.
  labs: { light: '#b45309', dark: '#fbbf24', hideBase: true }, // amber / gold
  projects: { light: '#2563eb', dark: '#60a5fa' }, // blue
  // (blog is a standalone /blog route — its violet accent lives in
  // src/app/(home)/blog/layout.tsx)
};

export function SectionTheme() {
  const pathname = usePathname();
  const section = pathname.split('/')[2] ?? '';
  const theme = SECTION_THEME[section];
  if (!theme) return null;

  const css =
    `:root{--color-fd-primary:${theme.light};--color-fd-ring:${theme.light}}` +
    `:root.dark{--color-fd-primary:${theme.dark};--color-fd-ring:${theme.dark}}` +
    (theme.hideBase ? 'body::before,body::after{display:none}' : '');

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
