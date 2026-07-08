export const appName = 'Docs';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

// Canonical origin for absolute URLs (sitemap, RSS, OG images, canonicals).
// NEXT_PUBLIC_SITE_URL wins; on Vercel the production domain is used; local
// builds fall back to localhost.
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000'),
);

export const author = {
  name: 'Rajkumar Neupane',
  url: 'https://rajkumarneupane.com',
  linkedin: 'https://www.linkedin.com/in/rjneupane',
};

// GitHub info used for "edit this page" / view-source links.
export const gitConfig = {
  user: 'raiz-toff',
  repo: 'MyDocs',
  branch: 'main',
};
