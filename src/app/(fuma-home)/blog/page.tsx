import Link from 'next/link';
import type { Metadata } from 'next';
import { blog, postDate, readingMinutes } from '@/lib/blog';
import SiteFooter from '@/components/site-footer';

// Blog index — standalone /blog route (no docs sidebar; this page IS the
// navigation). Card grid adapted from chanhdai.com's blog-02 registry block
// (MIT): cover art with an inset ring, title, date — 1/2/3 responsive columns
// with full-bleed screen-line rows and hairline column rails behind the grid.

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Stories, field notes, and the occasional detour — the human side of the lab.',
};

type Post = {
  url: string;
  slug: string;
  title: string;
  cover: string | null;
  date: Date | null;
  minutes: number;
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const updatedDate = (d: Date) =>
  `${d.getDate()} ${MONTHS[d.getMonth()].toUpperCase()} ${d.getFullYear()}`;

const cardDate = (d: Date | null) =>
  d
    ? d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'undated';

function DottedLeader() {
  return <span aria-hidden className="mx-4 flex-1 self-center border-t border-dotted border-fd-border" />;
}

function ArticleItem({ post }: { post: Post }) {
  return (
    <Link
      href={post.url}
      className={[
        'flex flex-col gap-2 p-2 no-underline transition-[background-color] ease-out hover:bg-fd-accent/50',
        'max-sm:screen-line-top max-sm:screen-line-bottom',
        'sm:max-md:nth-[2n+1]:screen-line-top sm:max-md:nth-[2n+1]:screen-line-bottom',
        'md:nth-[3n+1]:screen-line-top md:nth-[3n+1]:screen-line-bottom',
      ].join(' ')}
    >
      <div className="relative aspect-video">
        {post.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover}
            alt={post.title}
            className="size-full rounded-xl object-cover"
          />
        ) : (
          // cover-less posts get the site's diagonal-stripe filler
          <div className="flex size-full items-center justify-center rounded-xl diagonal-stripes">
            <span className="rounded-md bg-fd-background/85 px-2 py-1 font-mono text-[11px] text-fd-muted-foreground">
              {post.slug}
            </span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 rounded-xl inset-ring-1 inset-ring-black/10 dark:inset-ring-white/10" />
      </div>

      <div className="flex flex-col gap-2 p-2">
        <h3 className="text-lg leading-tight font-medium text-balance text-fd-foreground">
          {post.title}
        </h3>

        <dl>
          <dt className="sr-only">Published on</dt>
          <dd className="text-sm text-fd-muted-foreground">
            {post.date ? (
              <time dateTime={post.date.toISOString()}>{cardDate(post.date)}</time>
            ) : (
              cardDate(null)
            )}
            <span className="mx-1.5 text-fd-muted-foreground/40">·</span>
            {post.minutes} min
          </dd>
        </dl>
      </div>
    </Link>
  );
}

export default async function BlogIndexPage() {
  const posts: Post[] = await Promise.all(
    blog.getPages().map(async (p) => {
      const text = await p.data.getText('processed');
      const cover = (p.data as { cover?: string | null }).cover;
      return {
        url: p.url,
        slug: p.slugs[p.slugs.length - 1],
        title: p.data.title ?? p.slugs[p.slugs.length - 1],
        // only root-absolute covers are servable from the list page
        cover: cover && cover.startsWith('/') ? cover : null,
        date: postDate(p.data.date),
        minutes: readingMinutes(text),
      };
    }),
  );

  // newest first; undated posts sink to the bottom
  posts.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

  const latest = posts.find((p) => p.date)?.date;

  return (
    <>
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
        {/* header */}
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fd-muted-foreground">
          index <span className="mx-1 text-fd-muted-foreground/50">/</span> blog posts
        </p>
        <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight text-fd-foreground sm:text-5xl">
          Blog Posts<span className="text-fd-primary">.</span>
        </h1>
        <p className="mt-4 text-pretty text-[15px] text-fd-muted-foreground">
          Stories, field notes, and the occasional detour.
        </p>

        {/* count / updated rule */}
        <div className="mt-10 flex font-mono text-[11px] uppercase tracking-[0.16em] text-fd-muted-foreground">
          <span>{posts.length} entries</span>
          <DottedLeader />
          {latest ? (
            <span>
              updated {updatedDate(latest)}
              <span className="mx-2 text-fd-muted-foreground/40">/</span>
            </span>
          ) : null}
          <a href="/rss.xml" className="transition-colors hover:text-fd-primary">
            rss
          </a>
        </div>

        {posts.length === 0 ? (
          <p className="mt-10 text-fd-muted-foreground">
            Nothing here yet — the first post is being written.
          </p>
        ) : (
          <div className="relative mt-10 py-4">
            {/* hairline column rails behind the grid (chanhdai blog-02) */}
            <div className="pointer-events-none absolute inset-0 -z-1 grid grid-cols-1 gap-4 max-sm:hidden sm:grid-cols-2 md:grid-cols-3">
              <div className="border-r border-line" />
              <div className="border-l border-line md:border-x" />
              <div className="border-l border-line max-md:hidden" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {posts.map((post) => (
                <ArticleItem key={post.url} post={post} />
              ))}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
