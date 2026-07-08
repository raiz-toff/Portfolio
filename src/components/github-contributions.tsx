"use client";

import { useEffect, useState } from "react";
import { Panel } from "./panel";

type Activity = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };

const GITHUB_USERNAME = "raiz-toff";
const BLOCK_SIZE = 12;
const BLOCK_MARGIN = 2;
const STEP = BLOCK_SIZE + BLOCK_MARGIN;
const LABEL_HEIGHT = 16;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// GitHub's classic emerald contribution ramp.
const LEVEL_STYLES: { fill: string; opacity: number }[] = [
  { fill: "var(--muted-foreground)", opacity: 0.1 },
  { fill: "#0e4429", opacity: 1 },
  { fill: "#00733e", opacity: 1 },
  { fill: "#10b981", opacity: 1 },
  { fill: "#34eb9c", opacity: 1 },
];

function toWeeks(data: Activity[]) {
  const weeks: (Activity | null)[][] = [];
  let week: (Activity | null)[] = [];

  const firstDay = new Date(`${data[0].date}T12:00:00`).getDay();
  for (let i = 0; i < firstDay; i++) week.push(null);

  for (const day of data) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) weeks.push(week);
  return weeks;
}

function monthLabels(weeks: (Activity | null)[][]) {
  const labels: { text: string; x: number }[] = [];
  let last = -1;
  weeks.forEach((week, wi) => {
    const first = week.find(Boolean);
    if (!first) return;
    const month = Number(first.date.slice(5, 7)) - 1;
    if (month !== last) {
      // skip a cramped label right at the start of a partial first month
      if (labels.length === 0 || wi > labels[labels.length - 1].x / STEP + 2) {
        labels.push({ text: MONTHS[month], x: wi * STEP });
      }
      last = month;
    }
  });
  return labels;
}

function Graph({ data }: { data: Activity[] }) {
  const weeks = toWeeks(data);
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const width = weeks.length * STEP - BLOCK_MARGIN;
  const height = LABEL_HEIGHT + 7 * STEP - BLOCK_MARGIN;

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="overflow-x-auto px-4">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="mx-auto block"
          role="img"
          aria-label="GitHub contributions graph"
        >
          {monthLabels(weeks).map((label) => (
            <text
              key={label.x}
              x={label.x}
              y={10}
              className="fill-muted-foreground font-sans"
              fontSize="12"
            >
              {label.text}
            </text>
          ))}
          {weeks.map((week, wi) =>
            week.map(
              (day, di) =>
                day && (
                  <rect
                    key={day.date}
                    fill={LEVEL_STYLES[day.level].fill}
                    fillOpacity={LEVEL_STYLES[day.level].opacity}
                    x={wi * STEP}
                    y={LABEL_HEIGHT + di * STEP}
                    width={BLOCK_SIZE}
                    height={BLOCK_SIZE}
                  >
                    <title>{`${day.count} contribution${day.count === 1 ? "" : "s"} on ${day.date}`}</title>
                  </rect>
                )
            )
          )}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 px-4 text-sm leading-none">
        <p className="text-muted-foreground">
          {total.toLocaleString("en")} contributions in the past 365 days.
        </p>
        <div className="flex items-center gap-1" aria-hidden>
          <span className="mr-1 text-muted-foreground">Less</span>
          <svg width={STEP * 5 - BLOCK_MARGIN} height={BLOCK_SIZE}>
            {LEVEL_STYLES.map((style, level) => (
              <rect
                key={level}
                fill={style.fill}
                fillOpacity={style.opacity}
                x={level * STEP}
                width={BLOCK_SIZE}
                height={BLOCK_SIZE}
              />
            ))}
          </svg>
          <span className="ml-1 text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  );
}

export default function GitHubContributions() {
  const [data, setData] = useState<Activity[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch(
      `https://github-contributions-api.jogruber.de/v4/${GITHUB_USERNAME}?y=last`
    )
      .then((res) => {
        if (!res.ok) throw new Error("api unavailable");
        return res.json();
      })
      .then((json: { contributions: Activity[] }) => {
        if (json.contributions?.length) setData(json.contributions);
        else setFailed(true);
      })
      .catch(() => setFailed(true));
  }, []);

  // Nothing to show and nothing coming — collapse quietly instead of erroring.
  if (failed) return null;

  return (
    <Panel className="screen-line-top-none">
      <h2 className="sr-only">GitHub contributions</h2>
      {data ? (
        <Graph data={data} />
      ) : (
        <div className="flex h-45 w-full items-center justify-center">
          <span className="font-mono text-xs text-muted-foreground animate-pulse">
            polling github…
          </span>
        </div>
      )}
      <div className="h-px" />
    </Panel>
  );
}
