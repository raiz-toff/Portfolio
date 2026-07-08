"use client";

import { useState } from "react";
import { certInterfaces, type Issuer } from "@/data/profile";
import { Panel, PanelHeader, PanelTitle, PanelTitleSup } from "./panel";
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  CiscoIcon,
  GoogleIcon,
  NvidiaIcon,
  PacktIcon,
  RedHatIcon,
} from "./icons";

const VISIBLE_COUNT = 4;

const ISSUER_ICONS: Partial<
  Record<Issuer, (props: React.ComponentProps<"svg">) => React.ReactElement>
> = {
  google: GoogleIcon,
  cisco: CiscoIcon,
  nvidia: NvidiaIcon,
  redhat: RedHatIcon,
  packt: PacktIcon,
};

const ISSUER_INITIALS: Partial<Record<Issuer, string>> = {
  yonsei: "Y",
  "illinois-tech": "IIT",
};

function IssuerMark({ issuer }: { issuer: Issuer }) {
  const Icon = ISSUER_ICONS[issuer];
  if (Icon) return <Icon className="size-3.5 text-muted-foreground" />;
  return (
    <span className="font-mono text-[9px] font-semibold tracking-tight text-muted-foreground">
      {ISSUER_INITIALS[issuer]}
    </span>
  );
}

export default function Certifications() {
  const [expanded, setExpanded] = useState(false);
  const [openCourses, setOpenCourses] = useState<Set<string>>(new Set());
  const hiddenCount = certInterfaces.length - VISIBLE_COUNT;
  const visibleCerts = expanded
    ? certInterfaces
    : certInterfaces.slice(0, VISIBLE_COUNT);

  const toggleCourses = (port: string) => {
    setOpenCourses((prev) => {
      const next = new Set(prev);
      if (next.has(port)) next.delete(port);
      else next.add(port);
      return next;
    });
  };

  return (
    <Panel id="certs">
      <PanelHeader>
        <PanelTitle>
          Certifications
          <PanelTitleSup>({certInterfaces.length})</PanelTitleSup>
        </PanelTitle>
      </PanelHeader>

      <div className="border-b border-line px-4 py-2 font-mono text-[11px] text-muted-foreground/50">
        show interfaces status
      </div>

      <ul>
        {visibleCerts.map((cert, i) => {
          const badge = (
            <span className="mx-4 flex size-6 shrink-0 items-center justify-center rounded-md border border-muted-foreground/15 bg-muted ring-1 ring-line ring-offset-1 ring-offset-background">
              <IssuerMark issuer={cert.issuer} />
            </span>
          );

          const meta = (
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-xs text-muted-foreground">
              <span>{cert.proto}</span>
              {cert.date && (
                <>
                  <span className="text-border">·</span>
                  <span>{cert.date}</span>
                </>
              )}
              {cert.courses && (
                <>
                  <span className="text-border">·</span>
                  <span>{cert.courses.length} courses</span>
                </>
              )}
            </p>
          );

          const rowClassName =
            i < visibleCerts.length - 1 ? "border-b border-line" : "";

          if (cert.courses) {
            const isOpen = openCourses.has(cert.port);
            return (
              <li key={cert.port} className={rowClassName}>
                <div className="flex items-center pr-2">
                  {badge}
                  <div className="flex min-w-0 flex-1 items-center border-l border-dashed border-line">
                    <button
                      type="button"
                      onClick={() => toggleCourses(cert.port)}
                      aria-expanded={isOpen}
                      className="flex min-w-0 flex-1 items-center gap-3 p-4 text-left transition-colors hover:bg-muted/30"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-balance">
                          {cert.desc}
                        </h3>
                        {meta}
                      </div>
                      <ChevronDownIcon
                        className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {cert.href && (
                      <a
                        href={cert.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View ${cert.desc} credential`}
                        className="shrink-0 p-4 pl-0 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <ArrowUpRightIcon className="size-4" />
                      </a>
                    )}
                  </div>
                </div>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <ul className="space-y-0.5 border-l border-dashed border-line pl-3">
                      {cert.courses.map((course, ci) => (
                        <li
                          key={course}
                          className="font-mono text-[11px] text-muted-foreground/70"
                        >
                          <span className="text-muted-foreground/40 tabular-nums">
                            {String(ci + 1).padStart(2, "0")}
                          </span>
                          <span className="mx-1.5 text-border">·</span>
                          {course}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          }

          const inner = (
            <div className="flex items-center pr-2">
              {badge}
              <div className="flex min-w-0 flex-1 items-center gap-3 border-l border-dashed border-line p-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-balance">
                    {cert.desc}
                  </h3>
                  {meta}
                </div>
                {cert.href && (
                  <ArrowUpRightIcon className="size-4 shrink-0 text-muted-foreground" />
                )}
              </div>
            </div>
          );

          return (
            <li key={cert.port} className={rowClassName}>
              {cert.href ? (
                <a
                  href={cert.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block transition-colors hover:bg-muted/30"
                >
                  {inner}
                </a>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>

      {hiddenCount > 0 && (
        <div className="screen-line-top flex justify-center py-4">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={
              expanded
                ? "Show fewer certifications"
                : `Show ${hiddenCount} more certifications`
            }
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-1.5 font-mono text-xs text-muted-foreground ring-1 ring-transparent transition-colors hover:border-muted-foreground/30 hover:bg-muted/30 hover:text-foreground hover:ring-line"
          >
            {expanded ? "Show less" : "Show more"}
            <ChevronDownIcon
              className={`size-3.5 transition-transform duration-200 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      )}
    </Panel>
  );
}
