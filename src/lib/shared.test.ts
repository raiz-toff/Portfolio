import { afterEach, describe, expect, it, vi } from 'vitest';

const loadSiteUrl = async () => (await import('./shared')).siteUrl;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('siteUrl', () => {
  it('prefers NEXT_PUBLIC_SITE_URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://rajkumarneupane.com');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'ignored.vercel.app');
    expect((await loadSiteUrl()).origin).toBe('https://rajkumarneupane.com');
  });
  it('falls back to the Vercel production URL', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'example.vercel.app');
    expect((await loadSiteUrl()).origin).toBe('https://example.vercel.app');
  });
  it('falls back to localhost with neither set', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    expect((await loadSiteUrl()).origin).toBe('http://localhost:3000');
  });
});
