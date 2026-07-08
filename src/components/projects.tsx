import { projects } from "@/data/profile";
import { Panel, PanelHeader, PanelTitle, PanelTitleSup } from "./panel";
import { PackageIcon } from "./icons";

export default function Projects() {
  return (
    <Panel id="projects">
      <PanelHeader>
        <PanelTitle>
          Open Source
          <PanelTitleSup>({projects.length})</PanelTitleSup>
        </PanelTitle>
      </PanelHeader>

      <ul>
        {projects.map((p, i) => (
          <li
            key={p.name}
            className={i < projects.length - 1 ? "border-b border-line" : ""}
          >
            <div className="flex items-start pr-2">
              <span className="mx-4 mt-4 flex size-6 shrink-0 items-center justify-center rounded-md border border-muted-foreground/15 bg-muted ring-1 ring-line ring-offset-1 ring-offset-background [&_svg]:size-4 [&_svg]:text-muted-foreground">
                <PackageIcon />
              </span>
              <div className="min-w-0 flex-1 border-l border-dashed border-line p-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-sm font-medium">{p.name}</h3>
                  <span className="font-mono text-xs text-muted-foreground uppercase">
                    {p.kind} · {p.stack}
                  </span>
                </div>
                <p className="mt-1.5 max-w-[56ch] text-pretty text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
                <p className="mt-2 flex gap-4 font-mono text-xs">
                  {p.source && (
                    <a
                      href={p.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      source ↗
                    </a>
                  )}
                  {p.docs && (
                    <a
                      href={p.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      docs ↗
                    </a>
                  )}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
