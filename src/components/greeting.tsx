"use client";

// Time-of-day greeting for the viewer's own clock — "Good morning" reads odd
// coming from a portfolio, so this greets whoever's looking, not the owner.
// Client-only: paints a stable placeholder on first render, fills in after
// mount to avoid a server/client hour mismatch (same pattern as CurrentLocalTime).

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon, SunsetIcon } from "./icons";

function greetingForHour(hour: number) {
  if (hour < 12) {
    return { text: "Good morning", Icon: SunIcon, iconClass: "greeting-icon-sun" };
  }
  if (hour < 18) {
    return { text: "Good afternoon", Icon: SunsetIcon, iconClass: "greeting-icon-sunset" };
  }
  return { text: "Good evening", Icon: MoonIcon, iconClass: "greeting-icon-moon" };
}

const subscribeNever = () => () => {};

export function Greeting() {
  const hour = useSyncExternalStore<number | null>(
    subscribeNever,
    () => new Date().getHours(),
    () => null,
  );
  const { text, Icon, iconClass } =
    hour === null
      ? { text: "Hey there", Icon: null as typeof SunIcon | null, iconClass: "" }
      : greetingForHour(hour);

  return (
    <span
      className="greeting-pop inline-flex items-center gap-2"
      suppressHydrationWarning
    >
      {text}
      {Icon && (
        <Icon
          className={`size-7 shrink-0 text-muted-foreground ${iconClass}`}
        />
      )}
    </span>
  );
}
