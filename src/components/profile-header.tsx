import Image from "next/image";
import { identity } from "@/data/profile";
import StoryCover from "./cover/story-cover";
import FlipSentences from "./flip-sentences";
import { VerifiedIcon } from "./icons";

export default function ProfileHeader() {
  return (
    <div className="screen-line-bottom grid grid-cols-[auto_1fr] grid-rows-[1fr_auto] overflow-y-clip border-x border-line">
      {/* cover figure: the whole story — facility floor down to layer 1,
          ending at the bench. Full-bleed across the card; the hero variant
          keeps the prose on /cover and overlays a minimal chapter rail. */}
      <figure className="relative col-span-2 p-2">
        <StoryCover variant="hero" />
      </figure>

      {/* avatar cell */}
      <div className="flex flex-col">
        <div className="screen-line-top mt-auto shrink-0 border-r border-line">
          <div className="mx-0.5 my-0.75">
            <Image
              src="/img/avatar.jpg"
              alt="Rajkumar Neupane"
              width={128}
              height={128}
              unoptimized
              className="size-28 rounded-full object-cover ring-1 ring-border ring-offset-2 ring-offset-background select-none sm:size-32"
              priority
            />
          </div>
        </div>
      </div>

      {/* name + flip sentences */}
      <div className="flex flex-col">
        <div className="z-1 mt-auto border-t border-line">
          <div className="flex items-center gap-2 pl-4">
            <h1 className="-translate-y-px text-2xl/none font-medium tracking-tight sm:text-3xl/none">
              {identity.name}
            </h1>
            <VerifiedIcon
              className="size-5 text-led-green select-none"
              aria-hidden
            />
          </div>

          <FlipSentences
            sentences={identity.flipSentences}
            className="h-12 border-t border-line py-1 pl-4 sm:h-9"
          />
        </div>
      </div>
    </div>
  );
}
