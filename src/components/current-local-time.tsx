"use client";

// Live local time for a fixed timeZone, with a viewer-relative offset note
// ("9h behind") and a tiny analog clock whose hands track the time.
// Adapted from chanhdai.com's CurrentLocalTimeItem (MIT) — client-only, so it
// paints a stable placeholder on first render and fills in after mount.

import { useEffect, useState } from "react";

import { IconBox } from "./overview-item";

export function CurrentLocalTime({ timeZone }: { timeZone: string }) {
  const [time, setTime] = useState("");
  const [diff, setDiff] = useState("");
  const [hands, setHands] = useState(() => clockHandsPath(12, 0));

  useEffect(() => {
    const update = () => {
      const clock = computeClock(timeZone);
      setTime(clock.time);
      setHands(clockHandsPath(clock.hour, clock.minute));
      setDiff(clock.diff);
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [timeZone]);

  return (
    <div className="flex items-center gap-4 font-mono text-sm">
      <IconBox>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" />
          <path d={hands} suppressHydrationWarning />
        </svg>
      </IconBox>
      <p className="text-balance">
        <span suppressHydrationWarning>{time || "—:—"}</span>
        <span className="text-muted-foreground" suppressHydrationWarning>
          {diff}
        </span>
      </p>
    </div>
  );
}

function clockHandsPath(hour: number, minute: number) {
  const h = hour % 12;
  const round = (n: number) => Math.round(n * 1000) / 1000;

  const minuteAngle = (minute / 60) * 2 * Math.PI;
  const hourAngle = ((h + minute / 60) / 12) * 2 * Math.PI;

  const hx = round(12 + 3.6 * Math.sin(hourAngle));
  const hy = round(12 - 3.6 * Math.cos(hourAngle));
  const mx = round(12 + 6 * Math.sin(minuteAngle));
  const my = round(12 - 6 * Math.cos(minuteAngle));

  return `M12 12 L${hx} ${hy} M12 12 L${mx} ${my}`;
}

function computeClock(timeZone: string) {
  const now = new Date();

  const time = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(now);
  const hour = parseInt(time, 10);
  const minute = parseInt(time.slice(3), 10);

  // tz offset = (target wall-clock instant) − (UTC wall-clock instant), each
  // read back as a local Date. In minutes, positive = east of UTC.
  const viewerOffset = -now.getTimezoneOffset();
  const targetOffset =
    (new Date(now.toLocaleString("en-US", { timeZone })).getTime() -
      new Date(now.toLocaleString("en-US", { timeZone: "UTC" })).getTime()) /
    60000;
  const hoursDiff = Math.abs(targetOffset - viewerOffset) / 60;
  const diff =
    hoursDiff < 1
      ? " // same time"
      : ` // ${Math.floor(hoursDiff)}h ${
          targetOffset > viewerOffset ? "ahead" : "behind"
        }`;

  return { time, hour, minute, diff };
}
