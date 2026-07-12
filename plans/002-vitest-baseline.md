# Plan 002: Add a Vitest baseline covering the URL/content helpers

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 0c23f0b..HEAD -- package.json source.config.ts src/lib/blog.ts src/lib/shared.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition. (A diff in `source.config.ts`
> from plan 001's type annotations is EXPECTED and fine — plan 001 changed
> types only, not logic.)

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/001-make-lint-pass.md (both edit `source.config.ts`)
- **Category**: tests
- **Planned at**: commit `0c23f0b`, 2026-07-12

## Why this matters

The repo has **zero automated tests and no test runner** — the only signals
are `tsc` and the build. Every absolute URL on the site (canonicals,
sitemap, RSS, OG images) flows through `siteUrl` in `src/lib/shared.ts`,
and every migrated internal doc link is rewritten at build time by
`rewriteInternalPath` in `source.config.ts`. A regression in either ships
wrong URLs to production silently. This plan stands up Vitest and pins the
pure, highest-leverage helpers with unit tests, creating the verification
baseline later plans (and CI, plan 003) rely on.

## Current state

Next.js **16.2.10** App Router + Fumadocs 16. NOTE: Next 16 has breaking
changes vs. older Next.js; consult `node_modules/next/dist/docs/` if needed.

- `package.json` scripts (no `test`):

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "types:check": "fumadocs-mdx && next typegen && tsc --noEmit",
    "postinstall": "fumadocs-mdx"
  },
```

- `src/lib/shared.ts:9-14` — env-dependent origin used by every absolute URL:

```ts
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000'),
);
```

- `src/lib/blog.ts:19-30` — pure helpers `postDate` and `readingMinutes`,
  BUT the module also imports `collections/server` (the generated fumadocs
  content index), which cannot load under a plain test runner. The pure
  helpers must move to their own file.

```ts
export function postDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

export function readingMinutes(text: string): number {
  return Math.max(1, Math.round(text.split(/\s+/).length / 220));
}
```

- `source.config.ts` — three pure functions used by the MDX build pipeline:
  `cssStringToObject` (lines 8-23), `normalizeAttrName` (lines 78-86), and
  `rewriteInternalPath` (lines 90-102, with `INTERNAL_SECTION_RE` on line
  90). The link rewriter's contract (verified against live content):
  - `/labs/...`, `/projects/...`, `/ccna-labs/...` get a `/docs` prefix and
    lose any trailing slash: `/labs/vlan-labs/` → `/docs/labs/vlan-labs`.
  - Paths ending in a file extension are left alone (static assets), e.g.
    `/projects/network-map/ROAS.html`.
  - Everything else (external URLs, `/blog/...`, `#anchors`) is untouched.
  Like `blog.ts`, this file imports `fumadocs-mdx/config`, so the pure
  functions must move out to be testable.

- Repo convention: path alias `@/*` → `./src/*` (`tsconfig.json`).

## Commands you will need

| Purpose   | Command                                              | Expected on success |
|-----------|------------------------------------------------------|---------------------|
| Install   | `npm install --legacy-peer-deps`                     | exit 0              |
| Add dep   | `npm install --save-dev --legacy-peer-deps vitest`   | exit 0              |
| Tests     | `npm test`                                           | all pass            |
| Typecheck | `npm run types:check`                                | exit 0              |
| Lint      | `npm run lint`                                       | exit 0 (after plan 001) |
| Build     | `npm run build`                                      | exit 0              |

## Scope

**In scope** (the only files you should modify or create):
- `package.json` (add `vitest` devDependency + `"test": "vitest run"` script)
- `package-lock.json` (via npm)
- `vitest.config.ts` (create)
- `src/lib/content-utils.ts` (create — moved pure helpers)
- `src/lib/blog.ts` (re-export the moved helpers)
- `src/lib/mdx-transforms.ts` (create — moved pure helpers)
- `source.config.ts` (import the moved helpers)
- `src/lib/content-utils.test.ts`, `src/lib/shared.test.ts`,
  `src/lib/mdx-transforms.test.ts` (create)

**Out of scope** (do NOT touch):
- Any component, route, or content file.
- `src/lib/shared.ts` itself — test it as-is via env stubbing; do not
  refactor it.
- No other test libraries (no jsdom, no testing-library, no coverage tools).

## Git workflow

- Branch: `advisor/002-vitest-baseline`
- Commit style: conventional (e.g. `test: add vitest baseline for url/content helpers`)
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Install Vitest and wire the script

`npm install --save-dev --legacy-peer-deps vitest`

Add to `package.json` scripts: `"test": "vitest run"`.

Create `vitest.config.ts` in the repo root:

```ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

**Verify**: `npm test` → runs, reports "no test files found" (exit code may
be non-zero at this point — that's expected until Step 4)

### Step 2: Extract the pure blog helpers

Create `src/lib/content-utils.ts` containing `postDate` and
`readingMinutes` moved **verbatim** from `src/lib/blog.ts` (excerpt above).
In `src/lib/blog.ts`, delete the two function bodies and add:

```ts
export { postDate, readingMinutes } from './content-utils';
```

so all existing importers (`src/app/rss.xml/route.ts`, `src/app/sitemap.ts`,
blog pages) keep working unchanged.

**Verify**: `npm run types:check` → exit 0

### Step 3: Extract the pure MDX transform helpers

Create `src/lib/mdx-transforms.ts` containing, moved **verbatim** from
`source.config.ts`: `cssStringToObject`, `normalizeAttrName`,
`INTERNAL_SECTION_RE`, and `rewriteInternalPath` (keep their comments).
Export all four. In `source.config.ts`, delete the moved code and add:

```ts
import {
  cssStringToObject,
  normalizeAttrName,
  rewriteInternalPath,
} from '@/lib/mdx-transforms';
```

Note: if the `@/` alias fails to resolve in `source.config.ts` (it is
compiled by fumadocs-mdx, not Next), use a relative import
`./src/lib/mdx-transforms` instead.

**Verify**: `npm run types:check` → exit 0 (this runs `fumadocs-mdx`,
which compiles `source.config.ts` — it proves the import resolves)
**Verify**: `npm run build` → exit 0

### Step 4: Write the tests

`src/lib/content-utils.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { postDate, readingMinutes } from './content-utils';

describe('postDate', () => {
  it('passes Date instances through', () => {
    const d = new Date('2026-01-01');
    expect(postDate(d)).toBe(d);
  });
  it('parses date strings', () => {
    expect(postDate('2026-01-01')?.getUTCFullYear()).toBe(2026);
  });
  it('returns null for empty string, garbage, and undefined', () => {
    expect(postDate('')).toBeNull();
    expect(postDate('not a date')).toBeNull();
    expect(postDate(undefined)).toBeNull();
  });
});

describe('readingMinutes', () => {
  it('never returns less than 1', () => {
    expect(readingMinutes('short text')).toBe(1);
  });
  it('rounds by ~220 wpm', () => {
    expect(readingMinutes(Array(2200).fill('word').join(' '))).toBe(10);
  });
});
```

`src/lib/shared.test.ts` — `siteUrl` is computed at module load, so each
branch needs a fresh import:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

const loadSiteUrl = async () => (await import('./shared')).siteUrl;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('siteUrl', () => {
  it('prefers NEXT_PUBLIC_SITE_URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://rajkumarneupane.com');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'ignored.vercel.app');
    expect((await loadSiteUrl()).origin).toBe('https://rajkumarneupane.com');
  });
  it('falls back to the Vercel production URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'example.vercel.app');
    expect((await loadSiteUrl()).origin).toBe('https://example.vercel.app');
  });
  it('falls back to localhost with neither set', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '');
    expect((await loadSiteUrl()).origin).toBe('http://localhost:3000');
  });
});
```

Caveat: `vi.stubEnv('X', '')` makes the value falsy but **not undefined**,
and `shared.ts` uses `??` (nullish) plus a truthiness ternary. Check the
actual behavior: `'' ?? …` returns `''`, and `new URL('')` throws. If the
first fallback test fails for this reason, stub with
`vi.stubEnv('NEXT_PUBLIC_SITE_URL', undefined as unknown as string)` or use
`delete process.env.NEXT_PUBLIC_SITE_URL` inside the test instead — the
goal is testing the documented env contract, not fighting the stub API.

`src/lib/mdx-transforms.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  cssStringToObject,
  normalizeAttrName,
  rewriteInternalPath,
} from './mdx-transforms';

describe('rewriteInternalPath', () => {
  it('prefixes migrated section links with /docs and drops trailing slash', () => {
    expect(rewriteInternalPath('/labs/vlan-labs/')).toBe('/docs/labs/vlan-labs');
    expect(rewriteInternalPath('/ccna-labs/1.0-network-f/')).toBe('/docs/ccna-labs/1.0-network-f');
    expect(rewriteInternalPath('/projects/starlight-glide/')).toBe('/docs/projects/starlight-glide');
  });
  it('leaves static assets alone', () => {
    expect(rewriteInternalPath('/projects/network-map/ROAS.html')).toBe('/projects/network-map/ROAS.html');
  });
  it('leaves external and non-section URLs alone', () => {
    expect(rewriteInternalPath('https://example.com/labs/x')).toBe('https://example.com/labs/x');
    expect(rewriteInternalPath('/blog/some-post')).toBe('/blog/some-post');
  });
  it('preserves hash/query suffixes', () => {
    expect(rewriteInternalPath('/labs/vlan-labs/#setup')).toBe('/docs/labs/vlan-labs#setup');
  });
});

describe('cssStringToObject', () => {
  it('camelCases properties and keeps custom properties', () => {
    expect(cssStringToObject('background-color: red; --sl-x: 1px')).toEqual({
      backgroundColor: 'red',
      '--sl-x': '1px',
    });
  });
  it('skips malformed declarations', () => {
    expect(cssStringToObject('color red; ;')).toEqual({});
  });
});

describe('normalizeAttrName', () => {
  it('maps HTML-isms to JSX', () => {
    expect(normalizeAttrName('class')).toBe('className');
    expect(normalizeAttrName('for')).toBe('htmlFor');
    expect(normalizeAttrName('stroke-width')).toBe('strokeWidth');
    expect(normalizeAttrName('xlink:href')).toBe('xlinkHref');
  });
  it('keeps data-* and aria-* hyphenated', () => {
    expect(normalizeAttrName('data-theme')).toBe('data-theme');
    expect(normalizeAttrName('aria-label')).toBe('aria-label');
  });
});
```

If an expectation fails, first check whether the expectation mismatches the
implementation's actual (correct) behavior — fix the TEST to pin real
behavior; do not change the implementation to satisfy a guessed expectation.

**Verify**: `npm test` → all tests pass (expect 14+ tests, 3 files)

### Step 5: Full gate

**Verify**: `npm test` → exit 0 · `npm run types:check` → exit 0 ·
`npm run lint` → exit 0 · `npm run build` → exit 0

## Test plan

This plan IS the test plan; the three test files above are the deliverable.
Follow their structure (plain `describe`/`it`, node environment, no mocks
beyond `vi.stubEnv`) for any future tests.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm test` exits 0; ≥14 tests across 3 files pass
- [ ] `npm run types:check`, `npm run lint`, `npm run build` all exit 0
- [ ] `grep -n '"test"' package.json` → shows `vitest run`
- [ ] `git status` shows changes ONLY in the in-scope file list
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `source.config.ts` no longer contains the three helpers where described
  (drift from plan 001 beyond type annotations).
- After Step 3, `npm run build` fails and switching to a relative import
  doesn't fix it — the fumadocs-mdx compiler may not support imports from
  the config file; report this, and fall back to testing only
  `content-utils` and `shared` (leave `source.config.ts` untouched).
- Vitest cannot be installed with `--legacy-peer-deps` (peer conflict).
- You find yourself wanting to mock `fumadocs-core`, `next`, or the
  generated `collections/*` — that's out of scope; report instead.

## Maintenance notes

- Route-handler output (RSS XML shape, llms.txt) is still untested — the
  `escape` helper in `src/app/rss.xml/route.ts` is module-private. A future
  plan can export it or snapshot the route output; deferred deliberately.
- If `source.config.ts` gains new pure transforms, put them in
  `src/lib/mdx-transforms.ts` so they're born testable.
- Reviewer should scrutinize: the moved functions are verbatim (diff should
  show pure moves), and `blog.ts` still exports `postDate`/`readingMinutes`.
