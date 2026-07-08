'use client';

import type { ReactNode } from 'react';
import { RootProvider } from 'fumadocs-ui/provider/next';

// The portfolio's ⌘K is taken by its command menu, so docs search answers to
// "/" instead (ignored while typing in a field). Lives in a client module
// because the hotkey matcher is a function.
const searchHotKey = [
  {
    key: (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return false;
      const t = e.target as HTMLElement | null;
      return !(
        t &&
        (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
      );
    },
    display: '/',
  },
];

export function Provider({ children }: { children: ReactNode }) {
  return <RootProvider search={{ hotKey: searchHotKey }}>{children}</RootProvider>;
}
