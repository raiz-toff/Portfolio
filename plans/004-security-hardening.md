# Plan 004: Close the open image proxy and harden the two HTML-injection sinks

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 0c23f0b..HEAD -- next.config.ts "src/app/(fuma-home)/blog/[slug]/page.tsx" src/components/docs/mermaid.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `0c23f0b`, 2026-07-12

## Why this matters

Three defensive-maintenance items, all small:

1. `next.config.ts` allows the Next image optimizer to fetch from **any**
   HTTPS host. On the deployed domain that makes `/_next/image` an open
   image-resizing proxy anyone can drive — bandwidth/compute billed to this
   Vercel project — while **no code in the repo actually uses a remote
   image through `next/image`** (verified: every `next/image` src is a
   local `/img/...`-style path; the blog's remote-capable `cover` images
   render through plain `<img>`, which bypasses the optimizer).
2. The blog post JSON-LD is injected with raw `JSON.stringify`, which does
   not escape `<` — a `</script>` sequence in frontmatter would break out
   of the script element. Content is author-controlled today, so this is
   hardening, not a live vulnerability.
3. The Mermaid renderer sets `securityLevel: 'loose'` (disables the
   library's HTML sanitization) and injects render-error text through
   `dangerouslySetInnerHTML` unescaped.

## Current state

Next.js **16.2.10** App Router. NOTE: Next 16 has breaking changes vs.
older Next.js; consult `node_modules/next/dist/docs/` if needed.

- `next.config.ts` (whole relevant block):

```ts
// next.config.ts:7-15
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Allow remote images (e.g. badges/diagrams pasted from the web) so
    // next/image doesn't throw on unconfigured hosts.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};
```

- `src/app/(fuma-home)/blog/[slug]/page.tsx:49-52`:

```tsx
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
```

- `src/components/docs/mermaid.tsx:18-39` (initialize + error branch):

```tsx
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        fontFamily: 'inherit',
        theme: resolvedTheme === 'dark' ? 'dark' : 'default',
      });

      try {
        const { svg } = await mermaid.render(
          'mermaid-' + id.replace(/[^a-zA-Z0-9]/g, ''),
          chart,
        );
        if (!cancelled) setSvg(svg);
      } catch (err) {
        if (!cancelled) {
          setSvg(
            `<pre class="text-fd-muted-foreground">Failed to render diagram:\n${
              (err as Error).message
            }</pre>`,
          );
        }
      }
```

  and the render at lines 48-54 puts `svg` into `dangerouslySetInnerHTML`.
  Fenced ```mermaid blocks in MDX become `<Mermaid chart="..." />` via the
  remark plugin in `source.config.ts`.

## Commands you will need

| Purpose   | Command                          | Expected on success |
|-----------|----------------------------------|---------------------|
| Install   | `npm install --legacy-peer-deps` | exit 0              |
| Typecheck | `npm run types:check`            | exit 0              |
| Lint      | `npm run lint`                   | exit 0 (after plan 001; if plan 001 hasn't landed, expect the same 19 pre-existing errors and no NEW ones) |
| Build     | `npm run build`                  | exit 0              |
| Dev       | `npm run dev`                    | serves on :3000     |

## Scope

**In scope** (the only files you should modify):
- `next.config.ts`
- `src/app/(fuma-home)/blog/[slug]/page.tsx`
- `src/components/docs/mermaid.tsx`

**Out of scope** (do NOT touch):
- Adding CSP / security headers — considered and deferred (see
  `plans/README.md`); a mistuned CSP breaks the MDX inline styles.
- `src/components/docs/topology.tsx` (iframe sandbox) — deferred with CSP.
- Any content under `content/`.

## Git workflow

- Branch: `advisor/004-security-hardening`
- Commit style: conventional (e.g. `fix: restrict image optimizer hosts, escape json-ld, strict mermaid`)
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Confirm no remote `next/image` usage, then drop the wildcard

Preconditions (run all three; each must return no matches):

- `grep -rn 'src="http' src/ --include='*.tsx' | grep -iv '<img'` — remote
  srcs on components (the two known hits in `src/app/(fuma-home)/blog/`
  are plain `<img>` elements, which don't use the optimizer; verify any
  hit you find is a plain `<img>`, not `next/image`'s `<Image>`)
- `grep -rn "https://" src/data/profile.ts | grep -i "image\|img\|src:"` —
  expect none (all profile images are local paths)
- `grep -rn "^cover:" content/blog/*/index.mdx content/blog/*.mdx 2>/dev/null | grep "http"` — expect none

Then in `next.config.ts` delete the whole `images` block, leaving:

```ts
const nextConfig: NextConfig = {
  reactStrictMode: true,
};
```

**Verify**: `npm run build` → exit 0, no "hostname not configured" image errors

### Step 2: Escape the JSON-LD payload

In `src/app/(fuma-home)/blog/[slug]/page.tsx` change line 51 to:

```tsx
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
```

(`<` is valid JSON string escaping, so consumers parse identical data;
it just can't terminate the script element.)

**Verify**: `npm run dev`, then
`curl -s http://localhost:3000/blog/ccna-journey | grep -o 'application/ld+json' | head -1`
→ `application/ld+json` (the script tag still renders), and
`curl -s http://localhost:3000/blog/ccna-journey | grep -c '</script><script'` → `0`

### Step 3: Strict Mermaid + text-rendered errors

In `src/components/docs/mermaid.tsx`:

1. Change `securityLevel: 'loose'` to `securityLevel: 'strict'`.
2. Replace the string-built `<pre>` error with state rendered as text:
   add `const [error, setError] = useState<string | null>(null);` beside
   the `svg` state; in the try block on success call `setError(null)`
   before `setSvg(svg)`; in the catch block replace the `setSvg(...)` call
   with `setSvg(''); setError((err as Error).message);`. Then in the JSX,
   before the existing `<div dangerouslySetInnerHTML=…>` return, add:

```tsx
  if (error) {
    return (
      <pre className="my-4 overflow-x-auto text-fd-muted-foreground">
        Failed to render diagram:{'\n'}
        {error}
      </pre>
    );
  }
```

3. Update the stale comment above `dangerouslySetInnerHTML` if it mentions
   the error string.

Precondition for `'strict'`: authored diagrams must not rely on loose-mode
features. Check: `grep -rn '^\s*click ' content/` → expect no matches
inside mermaid blocks. If there ARE matches, use `securityLevel:
'antiscript'` instead of `'strict'` and say so in your report.

**Verify**: `npm run types:check` → exit 0
**Verify**: `grep -rln '\`\`\`mermaid' content/ | head -3` → pick one file,
map it to its route (e.g. `content/docs/labs/my-homelab/index.mdx` →
`/docs/labs/my-homelab`), open it under `npm run dev` in a browser and
confirm the diagram still renders as an SVG (not an error block). If no
browser is available, state that this check was skipped and why.

### Step 4: Full gate

**Verify**: `npm run build` → exit 0 · `npm run types:check` → exit 0 ·
`npm run lint` → no NEW errors vs. the pre-change output

## Test plan

No unit-test surface here (config + JSX attributes + a client component).
Behavior checks are inlined in the steps: build passes without the images
block, JSON-LD still emits parseable JSON, one real mermaid diagram still
renders. If plan 002 has landed, `npm test` must still pass untouched.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -c "remotePatterns" next.config.ts` → 0
- [ ] `grep -c "u003c" "src/app/(fuma-home)/blog/[slug]/page.tsx"` → 1
- [ ] `grep -c "securityLevel: 'loose'" src/components/docs/mermaid.tsx` → 0
- [ ] `npm run build` exits 0
- [ ] `git status` shows changes ONLY in the three in-scope files
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any Step 1 precondition grep finds a genuine remote `next/image` usage —
  then the fix is an explicit hostname allowlist, not deletion; report the
  hostname(s) found and stop.
- A mermaid diagram that rendered before Step 3 renders as an error or
  visibly broken SVG under `'strict'` AND under `'antiscript'`.
- `npm run build` fails after removing the `images` block.

## Maintenance notes

- If the owner later embeds genuinely remote images via `next/image`
  (e.g. shields.io badges in MDX rendered through an `<Image>` component),
  add an explicit `remotePatterns` entry for that hostname only — never
  `hostname: "**"`.
- The deferred CSP/security-headers work (see `plans/README.md`) becomes
  easier after this plan: fewer inline-HTML behaviors to allow for.
- Reviewer should scrutinize: one real blog post's rendered JSON-LD parses
  (`JSON.parse` of the script body) and one real diagram page.
