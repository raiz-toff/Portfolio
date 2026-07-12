# Plan 005: Fetch GitHub contributions on the server with daily revalidation

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 0c23f0b..HEAD -- src/components/github-contributions.tsx src/app/page.tsx`
> If either file changed since this plan was written, compare the "Current
> state" excerpts against the live code before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW-MED
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `0c23f0b`, 2026-07-12

## Why this matters

`src/components/github-contributions.tsx` is a client component that
fetches a third-party API (`github-contributions-api.jogruber.de`) in a
`useEffect` on **every home-page visit**: each visitor pays a render
waterfall ("polling github…" placeholder → data), the third-party host
sees every visitor's browser, and the fetch has no caching or abort
handling. The data (public contribution counts) changes at most daily.
Moving the fetch to the server with `revalidate: 86400` renders the graph
in the initial HTML, hits the API roughly once a day total, and removes
the client-side failure mode.

## Current state

Next.js **16.2.10** App Router. The repo does NOT enable
`cacheComponents`, so the classic fetch-caching model applies:
`fetch(url, { next: { revalidate: <seconds> } })` in a server component
(see `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`,
which shows exactly this API — read it if unsure).

- `src/components/github-contributions.tsx` (237 lines) — single file,
  `"use client"`, containing:
  - `Activity` type, constants (`GITHUB_USERNAME = "raiz-toff"`, sizes),
    `toWeeks`, `monthLabels`, `tipText` helpers (lines 7-70)
  - `Graph({ data })` — the SVG grid + portal tooltip (lines 74-198);
    genuinely needs the client (hover state, `createPortal`,
    `useLayoutEffect`)
  - the default export doing the client-side fetch (lines 200-237):

```tsx
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
```

- Sole usage: `src/app/page.tsx:26` renders `<GitHubContributions />`
  inside the (server-rendered, static) home page. `src/app/page.tsx` is a
  server component with client islands — this component becoming a server
  component fits that architecture.
- Repo conventions: components in `src/components/`, kebab-case filenames,
  default exports for page-level components, `Panel` wrapper from
  `./panel`, explanatory top-of-file comments.

## Commands you will need

| Purpose   | Command                          | Expected on success |
|-----------|----------------------------------|---------------------|
| Install   | `npm install --legacy-peer-deps` | exit 0              |
| Typecheck | `npm run types:check`            | exit 0              |
| Build     | `npm run build`                  | exit 0              |
| Dev       | `npm run dev`                    | serves on :3000     |

## Scope

**In scope**:
- `src/components/github-contributions.tsx` (rewrite as a server component)
- `src/components/github-contributions-graph.tsx` (create — the client half)

**Out of scope** (do NOT touch):
- `src/app/page.tsx` — the import and usage stay exactly as they are.
- `src/components/panel.tsx`, any styling/markup of the graph itself.
- Do not add a loading/Suspense state — the server render replaces it.

## Git workflow

- Branch: `advisor/005-server-github-contributions`
- Commit style: conventional (e.g. `perf: fetch github contributions server-side with daily revalidate`)
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Move the client half into `github-contributions-graph.tsx`

Create `src/components/github-contributions-graph.tsx` with `"use client"`
at the top. Move VERBATIM from the current file: the `Activity` type, all
constants and helpers (`BLOCK_SIZE` … `tipText`, `MONTHS`, `LEVEL_STYLES`,
`toWeeks`, `monthLabels`, `Tip` type), and the entire `Graph` component
with its imports (`useEffect, useLayoutEffect, useRef, useState`,
`createPortal`). Export:

```tsx
export type Activity = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };
export default function Graph({ data }: { data: Activity[] }) { … }
```

Keep every comment. `GITHUB_USERNAME` does NOT move (it belongs to the
fetcher).

### Step 2: Rewrite `github-contributions.tsx` as a server component

Replace the whole file with:

```tsx
// GitHub contribution graph, fetched server-side. The third-party API is
// hit at most once per revalidate window (not once per visitor), and the
// graph arrives in the initial HTML. If the API is down at render time the
// section collapses quietly, same as before.

import Graph, { type Activity } from "./github-contributions-graph";
import { Panel } from "./panel";

const GITHUB_USERNAME = "raiz-toff";

export default async function GitHubContributions() {
  let data: Activity[] | null = null;
  try {
    const res = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${GITHUB_USERNAME}?y=last`,
      { next: { revalidate: 86400 } },
    );
    if (res.ok) {
      const json = (await res.json()) as { contributions?: Activity[] };
      if (json.contributions?.length) data = json.contributions;
    }
  } catch {
    // API unreachable — render nothing rather than failing the page.
  }

  if (!data) return null;

  return (
    <Panel className="screen-line-top-none">
      <h2 className="sr-only">GitHub contributions</h2>
      <Graph data={data} />
      <div className="h-px" />
    </Panel>
  );
}
```

No `"use client"` directive in this file. `src/app/page.tsx` needs no
change (same default import path, and App Router accepts async components
rendered from server pages).

**Verify**: `npm run types:check` → exit 0
**Verify**: `grep -c '"use client"' src/components/github-contributions.tsx` → 0

### Step 3: Build and confirm the page stayed static

**Verify**: `npm run build` → exit 0. In the route summary, `/` must NOT
have become dynamic (it should be listed as static/prerendered, possibly
with a revalidate interval). If `/` turned fully dynamic (rendered
per-request), treat as a STOP condition.

### Step 4: Runtime check

`npm run dev`, then:

**Verify**: `curl -s http://localhost:3000/ | grep -c "GitHub contributions"`
→ `1` (the `sr-only` heading is present in the SERVER HTML — proof the
data arrived at render time, since the old client version only rendered
the Panel/heading immediately but the graph after fetch; additionally:)
**Verify**: `curl -s http://localhost:3000/ | grep -c "polling github"` → `0`

If the machine has no outbound network access, the section will be absent
(`grep -c` → 0); note that in the report and rely on the build/typecheck
gates plus a deploy-preview check instead.

## Test plan

The moved helpers (`toWeeks`, `monthLabels`, `tipText`) are pure and, after
this split, importable without the fetch side. If plan 002's Vitest
baseline has landed, ADD `src/components/github-contributions-graph.test.ts`
is NOT required by this plan — deliberately deferred to keep the diff a
pure move; note it as a follow-up in your report.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run types:check` and `npm run build` exit 0
- [ ] `grep -c '"use client"' src/components/github-contributions.tsx` → 0
- [ ] `grep -c '"use client"' src/components/github-contributions-graph.tsx` → 1
- [ ] `grep -c "revalidate: 86400" src/components/github-contributions.tsx` → 1
- [ ] `grep -rn "polling github" src/` → no matches (placeholder removed)
- [ ] `git status` shows changes ONLY in the two in-scope files
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The current file's content doesn't match the excerpt (drift).
- The build reports `/` as dynamic after Step 2 — the fetch options may be
  interacting with something unexpected; do not "fix" it by adding
  `export const dynamic = 'force-static'` without reporting first.
- `next: { revalidate: 86400 }` is rejected (type error or build warning
  saying the option is unsupported) — that would mean the caching model
  assumption is wrong for this Next version; read
  `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`
  and report what you find instead of guessing.
- You find yourself editing `src/app/page.tsx`.

## Maintenance notes

- If the jogruber API shape changes, the failure mode is a quietly missing
  section (by design). A follow-up could log a server-side warning.
- If `cacheComponents: true` is ever enabled in `next.config.ts`, this
  fetch should migrate to the `'use cache'` + `cacheLife` model — the
  `next: { revalidate }` option belongs to the previous model.
- Reviewer should scrutinize: the graph file is a verbatim move (diff shows
  relocation, not rewrites), and dark/light rendering of the graph is
  unchanged.
