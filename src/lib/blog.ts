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

export { postDate, readingMinutes } from './content-utils';
