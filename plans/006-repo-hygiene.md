# Plan 006: Repo hygiene — retire dead scripts, fix stale docs, document the contracts

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 0c23f0b..HEAD -- scripts content/blog/_post-template.mdx content/docs/ccna-labs/index.mdx .gitignore AGENTS.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `0c23f0b`, 2026-07-12

## Why this matters

Five small, independent cleanups left over from merging two repos
(portfolio + Starlight docs portal). Each is trivial but actively
misleading as it stands: two runnable scripts target a directory tree that
doesn't exist, the blog template names a route that doesn't exist, six hub
links point at wrong slugs, the one required env var has no checked-in
contract, and the agent-instructions file documents none of the repo's real
gotchas.

## Current state

- **Dead scripts.** `scripts/export-frontmatter.mjs:5-9` reads from
  `src/content/docs/...`; `scripts/sync-network-generator-docs.mjs:7`
  writes to `src/content/docs/projects/network-generator`. There is NO
  `src/content/` directory — content lives in `content/docs/`. The sync
  script also carries a placeholder repo URL with the note "UPDATE THIS URL
  once you create the new repo!" (line 6) and emits Starlight-style
  frontmatter Fumadocs ignores. Neither script is referenced by any
  `package.json` script. They are Starlight-era leftovers.

- **Stale blog-template path.** `content/blog/_post-template.mdx:16`:

```
  The timeline on /docs/blog picks it up automatically — nothing else to edit.
```

  The blog route is `/blog` (see `src/app/(fuma-home)/blog/`); `/docs/blog`
  does not exist.

- **Wrong CCNA hub slugs.** `content/docs/ccna-labs/index.mdx` links six
  section cards to slugs whose dots were dropped. Actual directories:
  `1.0-network-f`, `2.0-network-a`, `3.0-ip-connect`, `4.0-ip-services`,
  `5.0-security-f`, `6.0-auto-and-p` (see `ls content/docs/ccna-labs/`).
  The links (lines 130, 138, 146, 154, 162, 170):

```html
  <a href="/ccna-labs/10-network-f/" class="labs-hub-card">
  <a href="/ccna-labs/20-network-a/" class="labs-hub-card">
  <a href="/ccna-labs/30-ip-connect/" class="labs-hub-card">
  <a href="/ccna-labs/40-ip-services/" class="labs-hub-card">
  <a href="/ccna-labs/50-security-f/" class="labs-hub-card">
  <a href="/ccna-labs/60-auto-and-p/" class="labs-hub-card">
```

  NOTE: do NOT add a `/docs` prefix — the build pipeline already rewrites
  `/ccna-labs/...` → `/docs/ccna-labs/...` (`rewriteInternalPath` in
  `source.config.ts`, or `src/lib/mdx-transforms.ts` if plan 002 landed).
  Only the slugs are wrong. This page is currently `draft: true`, so the
  fix is invisible until the section publishes — fix it now anyway, while
  it's cheap.

- **No env contract.** `src/lib/shared.ts:10` reads
  `NEXT_PUBLIC_SITE_URL`; `README.md` explains it in prose; no
  `.env.example` exists and `.gitignore` line `.env*` would ignore one.

- **Thin agent guidance.** `AGENTS.md` is only the generic Next-16 warning:

```markdown
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
```

  `CLAUDE.md` is `@AGENTS.md`. None of the repo's real gotchas (install
  flag, `proxy.ts` = middleware, generated `.source/`, content layout,
  draft convention) are recorded.

## Commands you will need

| Purpose   | Command                          | Expected on success |
|-----------|----------------------------------|---------------------|
| Install   | `npm install --legacy-peer-deps` | exit 0              |
| Typecheck | `npm run types:check`            | exit 0              |
| Build     | `npm run build`                  | exit 0              |
| Lint      | `npm run lint`                   | exit 0 (after plan 001) |

## Scope

**In scope**:
- `scripts/export-frontmatter.mjs` (delete)
- `scripts/sync-network-generator-docs.mjs` (delete)
- `content/blog/_post-template.mdx` (one line)
- `content/docs/ccna-labs/index.mdx` (six hrefs — slug digits only)
- `.env.example` (create), `.gitignore` (one negation line)
- `AGENTS.md` (expand)

**Out of scope** (do NOT touch):
- `CLAUDE.md` — it already includes AGENTS.md by reference.
- Everything else in `content/docs/ccna-labs/index.mdx` (the inline
  `<style>` block, frontmatter, card text) — Starlight-CSS cleanup is a
  separate deferred finding.
- `README.md` — its env-var prose stays; `.env.example` complements it.
- `.claude/` directory.

## Git workflow

- Branch: `advisor/006-repo-hygiene`
- Commit style: conventional (e.g. `chore: retire starlight-era scripts, fix stale paths, document contracts`)
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Confirm the scripts are unreferenced, then delete them

**Verify first**: `grep -rn "export-frontmatter\|sync-network-generator" --include="*.json" --include="*.md" --include="*.mjs" --include="*.ts" --include="*.tsx" --include="*.yml" . 2>/dev/null | grep -v node_modules | grep -v "^./plans/"` → matches only inside the files themselves (their own filenames). If anything else references them, STOP.

Then `git rm scripts/export-frontmatter.mjs scripts/sync-network-generator-docs.mjs`.
If `scripts/` is now empty, remove the directory.

**Verify**: `ls scripts/ 2>&1` → "No such file or directory" (or only other files you did not delete)

### Step 2: Fix the blog-template route

In `content/blog/_post-template.mdx` line 16, change `/docs/blog` to `/blog`.

**Verify**: `grep -c "/docs/blog" content/blog/_post-template.mdx` → 0

### Step 3: Fix the six CCNA hub slugs

In `content/docs/ccna-labs/index.mdx`, change ONLY the digit portions:
`10-network-f` → `1.0-network-f`, `20-network-a` → `2.0-network-a`,
`30-ip-connect` → `3.0-ip-connect`, `40-ip-services` → `4.0-ip-services`,
`50-security-f` → `5.0-security-f`, `60-auto-and-p` → `6.0-auto-and-p`.
Leave the `/ccna-labs/` prefix and trailing slash exactly as they are (the
build rewrites them).

**Verify**: `grep -c 'href="/ccna-labs/[1-6]\.0-' content/docs/ccna-labs/index.mdx` → 6

### Step 4: Add the env contract

Create `.env.example`:

```bash
# Canonical origin for absolute URLs (canonicals, sitemap, RSS, OG images).
# Set in production; local dev falls back to http://localhost:3000 and
# Vercel deployments fall back to the Vercel production URL.
# See src/lib/shared.ts.
NEXT_PUBLIC_SITE_URL=https://rajkumarneupane.com
```

In `.gitignore`, directly below the line `.env*`, add:

```
!.env.example
```

**Verify**: `git check-ignore .env.example; echo $?` → `1` (not ignored)

### Step 5: Expand AGENTS.md

Replace the file body with (keep the existing warning as the first
section, verbatim):

```markdown
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Commands

- Install: `npm install --legacy-peer-deps` (REQUIRED — fumadocs peer-version skew; plain `npm install` fails)
- Dev: `npm run dev` · Build: `npm run build`
- Typecheck: `npm run types:check` (runs fumadocs-mdx codegen + next typegen + tsc)
- Lint: `npm run lint` (must stay at 0 errors)
- Test: `npm test` (Vitest; unit tests live next to sources as `*.test.ts`)

# Layout & conventions

- `src/app/` — App Router routes. `src/proxy.ts` is Next 16's renamed middleware (markdown content negotiation) — do not "fix" the name.
- `content/docs/` and `content/blog/` — MDX content (authored in Obsidian). There is NO `src/content/`; anything referencing it is stale.
- `.source/` — GENERATED by the fumadocs-mdx postinstall. Never edit or lint it.
- `src/data/profile.ts` — all portfolio content/data.
- Frontmatter `draft: true` hides a page everywhere (routes, sitemap, RSS, search).
- Internal doc links written Starlight-style (`/labs/...`) are rewritten to `/docs/...` at build time — see `rewriteInternalPath`.
- Client-only mount values use `useSyncExternalStore` with a never-firing subscribe (see `src/components/greeting.tsx`), not setState-in-effect.
- `NEXT_PUBLIC_SITE_URL` controls every absolute URL (see `.env.example`).

# Improvement plans

- `plans/` holds numbered, self-contained implementation plans with an index at `plans/README.md`. Executors: read the whole plan, honor its STOP conditions, update your status row.
```

Adjust honestly for reality at execution time: if plan 002 hasn't landed
yet, omit the Test line and the `useSyncExternalStore` line if plan 001
hasn't landed; the AGENTS.md must describe the repo as it IS.

**Verify**: `npm run types:check` → exit 0 (sanity)

### Step 6: Full gate

**Verify**: `npm run build` → exit 0 · `npm run types:check` → exit 0

## Test plan

Nothing here has a runtime code path (deletions, docs, content strings).
The build gate plus the per-step greps are the verification. If plan 002
landed, `npm test` must still pass.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `scripts/export-frontmatter.mjs` and `scripts/sync-network-generator-docs.mjs` do not exist
- [ ] `grep -c "/docs/blog" content/blog/_post-template.mdx` → 0
- [ ] `grep -c 'href="/ccna-labs/[1-6]\.0-' content/docs/ccna-labs/index.mdx` → 6
- [ ] `.env.example` exists and `git check-ignore .env.example` exits 1
- [ ] `AGENTS.md` contains a "# Commands" section
- [ ] `npm run build` exits 0
- [ ] `git status` shows changes ONLY in the in-scope files
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Step 1's grep finds a real reference to either script outside the
  scripts themselves and this plans directory.
- The six CCNA links don't match the excerpt (content drifted).
- Deleting the scripts breaks the build (it must not — they're unwired; if
  it does, something referenced them invisibly).

## Maintenance notes

- If the owner later creates the `network-generator` repo (see the
  Direction section in `plans/README.md`), write a NEW sync script against
  `content/docs/projects/` with Fumadocs frontmatter — don't resurrect the
  deleted one from git history unchanged.
- The CCNA hub page is still `draft: true` with an `admin-down` status on
  the docs landing topology (`src/app/(fuma-home)/docs/page.tsx:69`);
  flipping it live is a content decision for the owner, not a hygiene task.
- Keep AGENTS.md truthful as plans land — stale agent docs are worse than
  none.
