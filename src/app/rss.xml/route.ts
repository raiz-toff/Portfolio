import { blog, postDate } from '@/lib/blog';
import { author, siteUrl } from '@/lib/shared';

export const revalidate = false;

const escape = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

export function GET() {
  const abs = (path: string) => new URL(path, siteUrl).toString();

  const posts = blog
    .getPages()
    .map((page) => ({
      url: abs(page.url),
      title: page.data.title ?? page.slugs[page.slugs.length - 1],
      description: page.data.description ?? '',
      tags: page.data.tags ?? [],
      date: postDate(page.data.date),
    }))
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

  const items = posts
    .map((post) =>
      [
        '    <item>',
        `      <title>${escape(post.title)}</title>`,
        `      <link>${escape(post.url)}</link>`,
        `      <guid isPermaLink="true">${escape(post.url)}</guid>`,
        post.date ? `      <pubDate>${post.date.toUTCString()}</pubDate>` : null,
        post.description ? `      <description>${escape(post.description)}</description>` : null,
        ...post.tags.map((tag) => `      <category>${escape(tag)}</category>`),
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .join('\n');

  const lastBuildDate = posts.find((p) => p.date)?.date?.toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Rajkumar's Docs — Blog</title>
    <link>${escape(abs('/blog'))}</link>
    <description>Stories, field notes, and the occasional detour — by ${escape(author.name)}.</description>
    <language>en</language>
${lastBuildDate ? `    <lastBuildDate>${lastBuildDate}</lastBuildDate>\n` : ''}    <atom:link href="${escape(abs('/rss.xml'))}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
