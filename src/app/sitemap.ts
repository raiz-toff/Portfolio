import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { blog, postDate } from '@/lib/blog';
import { siteUrl } from '@/lib/shared';

// Every published page (portfolio + docs + blog), absolute against the
// canonical origin. Draft pages never reach the loaders, so they never leak
// in here. /cover is a design playground and stays unlisted.
export default function sitemap(): MetadataRoute.Sitemap {
  const abs = (path: string) => new URL(path, siteUrl).toString();

  const docs = source.getPages().map((page) => ({
    url: abs(page.url),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const posts = blog.getPages().map((page) => ({
    url: abs(page.url),
    lastModified: postDate(page.data.date) ?? undefined,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    { url: abs('/'), changeFrequency: 'weekly', priority: 1 },
    { url: abs('/about'), changeFrequency: 'monthly', priority: 0.9 },
    { url: abs('/docs'), changeFrequency: 'weekly', priority: 0.9 },
    { url: abs('/blog'), changeFrequency: 'weekly', priority: 0.8 },
    ...docs,
    ...posts,
  ];
}
