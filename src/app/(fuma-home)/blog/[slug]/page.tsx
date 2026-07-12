import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { blog, postDate, readingMinutes } from '@/lib/blog';
import { getMDXComponents } from '@/components/docs/mdx';
import { author, siteUrl } from '@/lib/shared';
import SiteFooter from '@/components/site-footer';

// Blog post — standalone article layout (no docs chrome): back link,
// title, dateline + reading time, prose body.

function formatPostDate(d: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export default async function BlogPostPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const page = blog.getPage([slug]);
  if (!page) notFound();

  const MDX = page.data.body;
  const text = await page.data.getText('processed');
  const date = postDate(page.data.date);
  const tags: string[] = page.data.tags ?? [];
  const cover = page.data.cover ?? undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: page.data.title,
    description: page.data.description ?? undefined,
    url: new URL(page.url, siteUrl).toString(),
    image: new URL(cover ?? `/og/blog/${slug}`, siteUrl).toString(),
    datePublished: date?.toISOString(),
    keywords: tags.length > 0 ? tags.join(', ') : undefined,
    author: { '@type': 'Person', name: author.name, url: author.url },
  };

  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-fd-muted-foreground no-underline transition-colors hover:text-fd-primary"
        >
          <ArrowLeft className="size-3" /> blog
        </Link>

        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="mt-6 aspect-[2/1] w-full rounded-xl object-cover outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
          />
        ) : null}

        <h1 className="mt-6 text-balance text-3xl font-bold tracking-tight text-fd-foreground sm:text-4xl">
          {page.data.title}
        </h1>
        {page.data.description ? (
          <p className="mt-4 text-pretty text-[16px] leading-relaxed text-fd-muted-foreground">
            {page.data.description}
          </p>
        ) : null}

        <p className="mt-6 border-b border-fd-border pb-6 font-mono text-[11.5px] uppercase tracking-[0.14em] text-fd-muted-foreground">
          {date ? `${formatPostDate(date)} · ` : ''}
          {readingMinutes(text)} min read
          {tags.length > 0 && (
            <span className="text-fd-muted-foreground/70">
              {tags.map((tag) => (
                <span key={tag}>
                  <span className="mx-2 text-fd-muted-foreground/40">/</span>
                  {tag}
                </span>
              ))}
            </span>
          )}
        </p>

        <article className="prose mt-8">
          <MDX components={getMDXComponents()} />
        </article>
      </main>
      <SiteFooter />
    </>
  );
}

export function generateStaticParams() {
  return blog.getPages().map((page) => ({ slug: page.slugs[0] }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const page = blog.getPage([slug]);
  if (!page) notFound();

  const date = postDate(page.data.date);
  const image = page.data.cover ?? `/og/blog/${slug}`;

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: { canonical: page.url },
    openGraph: {
      type: 'article',
      title: page.data.title,
      description: page.data.description ?? undefined,
      url: page.url,
      images: image,
      publishedTime: date?.toISOString(),
      authors: [author.url],
      tags: page.data.tags ?? undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: page.data.title,
      description: page.data.description ?? undefined,
      images: image,
    },
  };
}
