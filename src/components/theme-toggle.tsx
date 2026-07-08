"use client";

import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { useClickSound } from "@/hooks/use-click-sound";
import { MoonIcon, SunMediumIcon } from "./icons";

export default function ThemeToggle() {
  const [click] = useClickSound();
  // Theme state now lives in next-themes (fumadocs RootProvider) so the docs
  // theme toggle and this one stay in sync; same localStorage "theme" key.
  const { resolvedTheme, setTheme } = useTheme();

  const switchTheme = () => {
    flushSync(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"));
  };

  const handleClick = () => {
    click();
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !document.startViewTransition) switchTheme();
    else document.startViewTransition(switchTheme);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Toggle theme"
      className="relative flex size-8 items-center justify-center rounded-md border bg-background text-foreground/80 shadow-2xs transition-[background-color,scale] duration-150 ease-out after:absolute after:-inset-1.5 after:content-[''] hover:bg-muted active:scale-[0.96]"
    >
      <MoonIcon className="hidden size-4 dark:block" />
      <SunMediumIcon className="size-4 dark:hidden" />
    </button>
  );
}
