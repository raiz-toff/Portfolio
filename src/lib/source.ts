import { docs } from 'collections/server';
import { loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { docsContentRoute, docsImageRoute, docsRoute } from './shared';

// Hide pages marked `draft: true` in frontmatter from the sidebar, root
// switcher, and routes — mirrors Starlight's draft behaviour.
const fumadocsSource = docs.toFumadocsSource();

// 1. drop draft pages
const published = fumadocsSource.files.filter(
  (file) =>
    !(file.type === 'page' && (file.data as { draft?: boolean }).draft === true),
);

// 2. drop meta.json for folders left with no published pages, otherwise an
//    all-draft folder (e.g. Mega Lab) would still render as an empty shell.
const liveDirs = new Set<string>(['']);
for (const file of published) {
  if (file.type !== 'page') continue;
  const parts = file.path.split('/');
  parts.pop(); // filename
  for (let i = parts.length; i >= 0; i--) liveDirs.add(parts.slice(0, i).join('/'));
}
const publishedSource = {
  ...fumadocsSource,
  files: published.filter((file) => {
    if (file.type !== 'meta') return true;
    const parts = file.path.split('/');
    parts.pop(); // meta.json
    return liveDirs.has(parts.join('/'));
  }),
};

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: publishedSource,
  plugins: [lucideIconsPlugin()],
});

export function getPageImage(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `${docsImageRoute}/${segments.join('/')}`,
  };
}

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'content.md'];

  return {
    segments,
    url: `${docsContentRoute}/${segments.join('/')}`,
  };
}

export async function getLLMText(page: (typeof source)['$inferPage']) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}
