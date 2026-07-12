"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { identity, links } from "@/data/profile";
import { useClickSound } from "@/hooks/use-click-sound";
import { CornerDownLeftIcon, SearchIcon } from "./icons";

type Command = {
  group: string;
  label: string;
  hint?: string;
  action: () => void;
};

function buildCommands(close: () => void): Command[] {
  const go = (hash: string) => () => {
    close();
    // On the homepage the section exists — smooth-scroll to it. From any
    // other route (/about, /blog…) it doesn't, so navigate home with the
    // hash and let the browser land on the section.
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    else window.location.assign(`/${hash}`);
  };
  const open = (url: string) => () => {
    close();
    window.open(url, "_blank", "noopener,noreferrer");
  };
  // Same-site destinations navigate in place instead of spawning a tab.
  const visit = (url: string) => () => {
    close();
    window.location.assign(url);
  };

  return [
    { group: "Sections", label: "About", action: go("#about") },
    { group: "Sections", label: "Stack", action: go("#stack") },
    { group: "Sections", label: "Experience", action: go("#experience") },
    { group: "Sections", label: "Certifications", action: go("#certs") },
    { group: "Sections", label: "Lab Log", action: go("#lab-log") },
    { group: "Sections", label: "Open Source", action: go("#projects") },
    { group: "Sections", label: "Contact", action: go("#contact") },
    { group: "Links", label: "GitHub", hint: "raiz-toff", action: open(links.github) },
    { group: "Links", label: "LinkedIn", hint: "rjneupane", action: open(links.linkedin) },
    { group: "Links", label: "Credly", hint: "verify badges", action: open(links.credly) },
    { group: "Links", label: "Lab Notes", hint: "rajkumarneupane.com/docs", action: visit(links.labs) },
    { group: "Links", label: "Blog", hint: "rajkumarneupane.com/blog", action: visit("/blog") },
    { group: "Links", label: "Gallery", hint: "photos", action: open(links.gallery) },
    { group: "Links", label: "Resume", hint: "pdf", action: open(links.resume) },
    {
      group: "Links",
      label: "Email",
      hint: identity.email,
      action: () => {
        close();
        window.location.href = `mailto:${identity.email}`;
      },
    },
  ];
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground select-none">
      {children}
    </kbd>
  );
}

export default function CommandMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [click] = useClickSound();

  // Soft click on selection, whether picked by mouse or the Enter key.
  const select = (cmd?: Command) => {
    if (!cmd) return;
    click();
    cmd.action();
  };

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setCursor(0);
  }, []);

  const commands = buildCommands(close);
  const q = query.trim().toLowerCase();
  const filtered = q
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(q) || c.hint?.toLowerCase().includes(q)
      )
    : commands;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((v) => !v);
      } else if (e.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(filtered[cursor]);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          click();
          setIsOpen(true);
        }}
        aria-label="Search"
        className="relative flex h-8 items-center gap-1.5 rounded-md px-1.5 text-muted-foreground transition-[color,scale] duration-150 ease-out after:absolute after:-inset-1.5 after:content-[''] hover:text-foreground active:scale-[0.96]"
      >
        <SearchIcon className="size-4" />
        <span className="hidden gap-0.5 sm:flex">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      {isOpen && (
        <div
          className="backdrop-fade fixed inset-0 z-100 flex items-start justify-center bg-black/40 p-4 pt-[15vh] backdrop-blur-xs"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="menu-pop w-full max-w-md overflow-hidden rounded-lg border bg-background shadow-2xl">
            <div className="flex items-center gap-2 border-b px-3">
              <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCursor(0);
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Type to search…"
                className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <Kbd>Esc</Kbd>
            </div>

            <ul className="max-h-80 overflow-y-auto p-1.5">
              {filtered.length === 0 && (
                <li className="px-2.5 py-6 text-center font-mono text-xs text-muted-foreground">
                  no route to host — nothing matches &quot;{query}&quot;
                </li>
              )}
              {filtered.map((cmd, i) => {
                const showGroup = i === 0 || filtered[i - 1].group !== cmd.group;
                return (
                  <li key={`${cmd.group}-${cmd.label}`}>
                    {showGroup && (
                      <p className="px-2.5 pt-2 pb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                        {cmd.group}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => select(cmd)}
                      onMouseEnter={() => setCursor(i)}
                      className={`flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left text-sm ${
                        i === cursor ? "bg-muted" : ""
                      }`}
                    >
                      <span className="flex min-w-0 items-baseline gap-2">
                        {cmd.label}
                        {cmd.hint && (
                          <span className="truncate font-mono text-xs text-muted-foreground">
                            {cmd.hint}
                          </span>
                        )}
                      </span>
                      {i === cursor && (
                        <CornerDownLeftIcon className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
