import Image from "next/image";
import { labLog, links } from "@/data/profile";
import { Panel, PanelHeader, PanelTitle, PanelTitleSup } from "./panel";
import { ArrowUpRightIcon } from "./icons";

export default function LabLog() {
  return (
    <Panel id="lab-log">
      <PanelHeader>
        <PanelTitle>
          Lab Log
          <PanelTitleSup>({labLog.length})</PanelTitleSup>
        </PanelTitle>
      </PanelHeader>

      <ul className="grid sm:grid-cols-2">
        {labLog.map((entry, i) => (
          <li
            key={entry.href}
            className={[
              // hairline grid: every cell but the last row gets a bottom rule;
              // on two columns, left cells get a right rule
              i < labLog.length - 1 ? "border-b border-line" : "",
              i < labLog.length - 2 ? "sm:border-b" : "sm:border-b-0",
              i % 2 === 0 ? "sm:border-r sm:border-line" : "",
              i >= labLog.length - 2 ? "sm:!border-b-0" : "",
            ].join(" ")}
          >
            <a href={entry.href} className="group block p-4">
              <div className="overflow-hidden rounded-md border border-line">
                <Image
                  src={entry.image}
                  alt=""
                  width={880}
                  height={495}
                  unoptimized
                  className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>

              <p className="mt-3 font-mono text-xs text-muted-foreground/70">
                {entry.date}
              </p>

              <h3 className="mt-1 flex items-baseline gap-1.5 text-base font-medium">
                <span className="decoration-current/30 underline-offset-3 transition-colors group-hover:underline">
                  {entry.title}
                </span>
                <ArrowUpRightIcon className="size-3.5 shrink-0 self-center text-muted-foreground/50 transition-colors group-hover:text-foreground" />
              </h3>

              <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
                {entry.blurb}
              </p>
            </a>
          </li>
        ))}
      </ul>

      <div className="screen-line-top flex justify-center py-3">
        <a
          href={links.labs}
          className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          all lab notes → /docs
        </a>
      </div>
    </Panel>
  );
}
