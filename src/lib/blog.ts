import { blogPosts } from 'collections/server';
import { loader } from 'fumadocs-core/source';

// Standalone blog source (content/blog → /blog), mirroring the docs loader's
// draft filtering: pages marked `draft: true` never publish.
const blogSource = blogPosts.toFumadocsSource();

export const blog = loader({
  baseUrl: '/blog',
  source: {
    ...blogSource,
    files: blogSource.files.filter(
      (file) =>
        !(file.type === 'page' && (file.data as { draft?: boolean }).draft === true),
    ),
  },
});

export function postDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

export function readingMinutes(text: string): number {
  return Math.max(1, Math.round(text.split(/\s+/).length / 220));
}
