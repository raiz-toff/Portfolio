# Plan 003: Add a GitHub Actions CI gate (typecheck, lint, test, build)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 0c23f0b..HEAD -- package.json vercel.json .github`
> Confirm `package.json` now has a `test` script (from plan 002) and that
> `.github/workflows/` does not already exist; if a workflow already exists,
> STOP and report.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-make-lint-pass.md (lint must be green), plans/002-vitest-baseline.md (test script must exist)
- **Category**: dx
- **Planned at**: commit `0c23f0b`, 2026-07-12

## Why this matters

Nothing gates `main`: no `.github/workflows/` exists, and `vercel.json`
only sets the install command. Before plans 001/002, lint was failing with
19 errors and nothing noticed. With only 3 commits in history, the pattern
is being set now — a CI gate makes every later plan's "done criteria"
enforceable on every push.

## Current state

- No `.github/` directory exists in the repo.
- `vercel.json` (deployment config, unrelated to CI — do not modify):

```json
{
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "nextjs"
}
```

- Install REQUIRES `--legacy-peer-deps` (fumadocs peer-version skew; also
  documented in `README.md`). `npm ci` accepts the same flag.
- Verification commands, all expected green after plans 001/002:
  `npm run types:check`, `npm run lint`, `npm test`, `npm run build`.
- `package.json` has no pinned Node version and no `.nvmrc`; `@types/node`
  is `^20`. Node 22 LTS is safe for Next 16.

## Commands you will need

| Purpose        | Command                          | Expected on success |
|----------------|----------------------------------|---------------------|
| Install        | `npm ci --legacy-peer-deps`      | exit 0              |
| Typecheck      | `npm run types:check`            | exit 0              |
| Lint           | `npm run lint`                   | exit 0              |
| Tests          | `npm test`                       | exit 0              |
| Build          | `npm run build`                  | exit 0              |
| Validate YAML  | `node -e "const fs=require('fs');const s=fs.readFileSync('.github/workflows/ci.yml','utf8');if(!s.includes('npm ci --legacy-peer-deps'))process.exit(1)"` | exit 0 |

## Scope

**In scope** (the only files you should create):
- `.github/workflows/ci.yml`

**Out of scope** (do NOT touch):
- `vercel.json` — deployment config; CI is separate.
- `package.json` — no new scripts needed.
- Branch-protection settings — that's a GitHub UI/API action for the owner,
  not a repo file; mention it in your report instead.

## Git workflow

- Branch: `advisor/003-add-ci-workflow`
- Commit style: conventional (e.g. `ci: add typecheck/lint/test/build workflow`)
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create the workflow

Create `.github/workflows/ci.yml` with exactly:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci --legacy-peer-deps
      - run: npm run types:check
      - run: npm run lint
      - run: npm test
      - run: npm run build
        env:
          NEXT_PUBLIC_SITE_URL: https://rajkumarneupane.com
```

(The `NEXT_PUBLIC_SITE_URL` env makes CI builds produce production-shaped
absolute URLs, matching the contract documented in `README.md` and
`src/lib/shared.ts:9-14`.)

**Verify**: the YAML-validation command from the table → exit 0

### Step 2: Prove the pipeline locally

Run the exact command sequence the workflow runs, in order, from a clean
tree. NOTE: `npm ci` deletes `node_modules` and reinstalls — this is safe
here (the `postinstall` regenerates `.source/`), but takes a few minutes.

**Verify**: `npm ci --legacy-peer-deps && npm run types:check && npm run lint && npm test && npm run build` → exit 0

## Test plan

The workflow is itself the test infrastructure; local execution of the same
command chain (Step 2) is the proof it will pass on GitHub's runners.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `.github/workflows/ci.yml` exists and contains all five run steps
- [ ] The full local command chain (Step 2) exits 0
- [ ] `git status` shows ONLY the new workflow file
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `package.json` has no `test` script (plan 002 not landed) — this plan
  must not proceed without it.
- `npm run lint` is not green on the current tree (plan 001 not landed).
- The local chain fails at `npm run build` for a network-dependent reason
  (e.g. Google Fonts fetch in `src/app/layout.tsx` needs egress). Report
  it — the fix (font fallback or workflow-level retry) is a scope change.

## Maintenance notes

- When the owner wants enforcement, enable branch protection on `main`
  requiring the `checks` job — repo settings, not a file.
- If install stops needing `--legacy-peer-deps` (fumadocs versions
  realigned — see the deferred DEP-01 finding in `plans/README.md`), update
  both this workflow and `vercel.json` together.
- Dependabot/renovate for actions versions is a sensible follow-up; out of
  scope here.
