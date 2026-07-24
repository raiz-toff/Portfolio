import Image from "next/image";
import Link from "next/link";
import { blog, postDate } from "@/lib/blog";
import { Panel, PanelHeader, PanelTitle, PanelTitleSup, Separator } from "./panel";
import { ArrowUpRightIcon } from "./icons";

// Blog posts flagged `featured: true` in frontmatter, surfaced on the homepage.
// This is the ONLY place that reads the `featured` field — flip it in a post's
// frontmatter and the post appears/disappears here, no hand-maintained list.
// Cards mirror the Lab Log grid so the two content panels read as one system.

const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

// Lowercase "jul 2026" stamp, matching the Lab Log date style.
function stamp(date: Date | null): string {
  return date ? `${MONTHS[date.getMonth()]} ${date.getFullYear()}` : "undated";
}

type FeaturedPost = {
  url: string;
  slug: string;
  title: string;
  blurb: string;
  cover: string | null;
  date: Date | null;
};

export default function FeaturedPosts() {
  const posts: FeaturedPost[] = blog
    .getPages()
    .filter((page) => (page.data as { featured?: boolean | null }).featured === true)
    .map((page) => {
      const slug = page.slugs[page.slugs.length - 1] ?? "";
      const cover = (page.data as { cover?: string | null }).cover;
      return {
        url: page.url,
        slug,
        title: page.data.title ?? slug,
        blurb: (page.data as { description?: string | null }).description ?? "",
        // only root-absolute covers are servable straight from a static route
        cover: cover && cover.startsWith("/") ? cover : null,
        date: postDate(page.data.date),
      };
    })
    // newest first; undated posts sink to the bottom
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

  // Nothing featured → render nothing (no empty panel, no orphan divider).
  if (posts.length === 0) return null;

  return (
    <>
      <Panel id="featured">
        <PanelHeader>
          <PanelTitle>
            Featured Writing
            <PanelTitleSup>({posts.length})</PanelTitleSup>
          </PanelTitle>
        </PanelHeader>

        <ul className="grid sm:grid-cols-2">
          {posts.map((post, i) => (
            <li
              key={post.url}
              className={[
                // hairline grid: every cell but the last row gets a bottom rule;
                // on two columns, left cells get a right rule
                i < posts.length - 1 ? "border-b border-line" : "",
                i < posts.length - 2 ? "sm:border-b" : "sm:border-b-0",
                i % 2 === 0 ? "sm:border-r sm:border-line" : "",
                i >= posts.length - 2 ? "sm:!border-b-0" : "",
              ].join(" ")}
            >
              <Link href={post.url} className="group block p-4">
                <div className="overflow-hidden rounded-md border border-line">
                  {post.cover ? (
                    <Image
                      src={post.cover}
                      alt=""
                      width={880}
                      height={495}
                      unoptimized
                      className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    // cover-less posts get the site's diagonal-stripe filler
                    <div className="flex aspect-video w-full items-center justify-center diagonal-stripes">
                      <span className="rounded-md bg-background/85 px-2 py-1 font-mono text-[11px] text-muted-foreground">
                        {post.slug}
                      </span>
                    </div>
                  )}
                </div>

                <p className="mt-3 font-mono text-xs text-muted-foreground/70">
                  {stamp(post.date)}
                </p>

                <h3 className="mt-1 flex items-baseline gap-1.5 text-base font-medium">
                  <span className="decoration-current/30 underline-offset-3 transition-colors group-hover:underline">
                    {post.title}
                  </span>
                  <ArrowUpRightIcon className="size-3.5 shrink-0 self-center text-muted-foreground/50 transition-colors group-hover:text-foreground" />
                </h3>

                <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {post.blurb}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="screen-line-top flex justify-center py-3">
          <Link
            href="/blog"
            className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            all posts → /blog
          </Link>
        </div>
      </Panel>

      <Separator />
    </>
  );
}
