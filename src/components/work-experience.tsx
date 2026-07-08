"use client";

// Adapted from chanhdai.com's WorkExperience block (MIT, © Chánh Đại):
// company → positions grouping, a timeline rail, collapsible position details,
// and skill chips — rebuilt on this site's tokens with a CSS-only collapse
// (no date-fns / react-markdown / radix deps).

import Image from "next/image";
import { useState } from "react";

import type { ExperienceCompany, ExperiencePosition } from "@/data/profile";
import {
  BriefcaseIcon,
  GraduationCapIcon,
  ServerIcon,
  WrenchIcon,
} from "./icons";

const KIND_ICON = {
  server: ServerIcon,
  grad: GraduationCapIcon,
  briefcase: BriefcaseIcon,
  wrench: WrenchIcon,
} as const;

export function WorkExperience({
  companies,
}: {
  companies: ExperienceCompany[];
}) {
  return (
    <div className="text-foreground">
      {companies.map((company) => (
        <CompanyItem key={company.id} company={company} />
      ))}
    </div>
  );
}

function CompanyItem({ company }: { company: ExperienceCompany }) {
  return (
    <div className="screen-line-bottom space-y-4 px-4 py-5">
      <div className="group flex items-center gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full">
          {company.logo ? (
            <Image
              src={company.logo}
              alt={company.org}
              width={24}
              height={24}
              unoptimized
              className="size-6 rounded-full bg-white object-contain grayscale transition-[filter] duration-300 group-hover:grayscale-0"
              aria-hidden
            />
          ) : (
            <span className="size-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          )}
        </span>

        <h3 className="text-base leading-snug font-semibold">
          {company.website ? (
            <a
              className="link"
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
            >
              {company.org}
            </a>
          ) : (
            company.org
          )}
        </h3>

        {company.current && (
          <span
            className="relative flex size-2 items-center justify-center"
            aria-label="Current"
          >
            <span className="absolute inline-flex size-3 animate-ping rounded-full bg-led-green opacity-50" />
            <span className="relative inline-flex size-2 rounded-full bg-led-green" />
          </span>
        )}

        <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground/70">
          {company.where}
        </span>
      </div>

      {/* timeline rail runs through the position icons */}
      <div className="relative space-y-4 before:absolute before:left-3 before:h-full before:w-px before:bg-line">
        {company.positions.map((position, i) => (
          <PositionItem key={i} position={position} />
        ))}
      </div>
    </div>
  );
}

function PositionItem({ position }: { position: ExperiencePosition }) {
  const hasNotes = position.notes.length > 0;
  const [open, setOpen] = useState(position.expanded ?? false);
  const Icon = KIND_ICON[position.kind];
  const duration = formatDuration(position.period);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => hasNotes && setOpen((o) => !o)}
        aria-expanded={hasNotes ? open : undefined}
        disabled={!hasNotes}
        className="group -mx-2 block w-full rounded-lg px-2 py-1 text-left transition-colors enabled:cursor-pointer enabled:hover:bg-muted/40"
      >
        <div className="mb-1 flex items-start gap-3">
          <span className="relative z-1 flex size-6 shrink-0 items-center justify-center rounded-md border border-muted-foreground/15 bg-muted ring-1 ring-line ring-offset-1 ring-offset-background [&_svg]:size-4 [&_svg]:text-muted-foreground">
            <Icon />
          </span>

          <h4 className="flex-1 text-base font-medium text-balance">
            {position.title}
          </h4>

          {hasNotes && (
            <ChevronDown
              className={`mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            />
          )}
        </div>

        <div className="flex items-center gap-2 pl-9 font-mono text-xs text-muted-foreground">
          {position.employmentType && (
            <>
              <span>{position.employmentType}</span>
              <span className="h-3 w-px bg-border" />
            </>
          )}
          <span className="tabular-nums">{position.period}</span>
          {duration && (
            <>
              <span className="h-3 w-px bg-border" />
              <span className="tabular-nums">{duration}</span>
            </>
          )}
        </div>
      </button>

      {/* CSS-only collapse: 0fr → 1fr animates height with no JS measurement */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <ul className="space-y-1.5 pt-2 pl-9">
            {position.notes.map((note, ni) => (
              <li
                key={ni}
                className="text-sm leading-relaxed text-muted-foreground before:mr-2 before:text-foreground/30 before:content-['—']"
              >
                {note}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {position.skills && position.skills.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 pt-3 pl-9">
          {position.skills.map((skill) => (
            <li key={skill}>
              <span className="inline-flex items-center rounded-md border bg-muted/50 px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                {skill}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

// Derives a "Ny" chip from clean year ranges ("2023 — 2025", "2024 — present").
// Narrative periods ("before the move") yield "" and simply show no duration.
function formatDuration(period: string): string {
  const m = period.match(/(\d{4})\s*—\s*(\d{4}|present)/i);
  if (!m) return "";
  const start = parseInt(m[1], 10);
  const end =
    m[2].toLowerCase() === "present"
      ? new Date().getFullYear()
      : parseInt(m[2], 10);
  const years = end - start;
  return years > 0 ? `${years}y` : "";
}
