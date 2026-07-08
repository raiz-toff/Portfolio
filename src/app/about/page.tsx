import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { identity, story, workshopPhotos } from "@/data/profile";
import { Panel, PanelContent, Separator } from "@/components/panel";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "The Story — Rajkumar Neupane",
  description:
    "From a chip-level repair bench in Kathmandu to a home lab in Toronto — the whole story, chapter by chapter.",
};

export default function StoryPage() {
  return (
    <div className="relative isolate flex-1">
      <SiteHeader />

      <main className="max-w-screen overflow-x-clip px-2">
        <div className="mx-auto md:max-w-3xl">
          <Panel className="screen-line-bottom-none">
            <PanelContent className="space-y-3">
              <Link
                href="/#about"
                className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                ← back to front page
              </Link>

              <div>
                <h1 className="text-3xl font-medium tracking-tight text-balance">
                  The Story
                </h1>
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  est. kathmandu → toronto
                </p>
              </div>
            </PanelContent>
          </Panel>

          <Panel>
            {story.map((chapter, i) => (
              <article
                key={chapter.id}
                id={chapter.id}
                className={`px-4 py-6 ${
                  i < story.length - 1 ? "screen-line-bottom" : ""
                }`}
              >
                <h2 className="text-xl font-semibold tracking-tight">
                  {chapter.title}
                </h2>

                <div className="mt-3 space-y-3">
                  {chapter.paragraphs.map((para, pi) => (
                    <p
                      key={pi}
                      className="max-w-[65ch] text-pretty text-base leading-relaxed text-foreground/90"
                    >
                      {para}
                    </p>
                  ))}
                </div>

                {chapter.id === "off-the-clock" && (
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    {workshopPhotos.map((photo) => (
                      <figure key={photo.src}>
                        <div className="overflow-hidden rounded-md outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10">
                          <Image
                            src={photo.src}
                            alt={photo.alt}
                            width={400}
                            height={520}
                            unoptimized
                            className="aspect-[4/5] w-full object-cover"
                          />
                        </div>
                        <figcaption className="mt-1.5 font-mono text-xs text-muted-foreground">
                          fig. {photo.caption}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </Panel>

          <Separator />

          <Panel className="screen-line-top-none">
            <PanelContent>
              <p className="font-mono text-sm text-muted-foreground">
                Full certifications on{" "}
                <a
                  className="link"
                  href="https://www.credly.com/users/rajkumarneupane"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Credly
                </a>
                {" · "}
                more of the workshop on{" "}
                <a
                  className="link"
                  href="https://gallery.rajkumarneupane.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  the gallery
                </a>
                {" · "}
                <a className="link" href={`mailto:${identity.email}`}>
                  say hello
                </a>
              </p>
            </PanelContent>
          </Panel>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
