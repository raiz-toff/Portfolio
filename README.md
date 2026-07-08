# rajkumarneupane.com

Portfolio, documentation, and blog — one Next.js app, one domain.

Merged from two repos: the portfolio (this repo's origin, design adapted from
[chanhdai.com](https://github.com/ncdai/chanhdai.com), MIT) and the Fumadocs
documentation portal (formerly deployed at labs.rajkumarneupane.com).

## Map

| Route | What lives there |
| --- | --- |
| `/` | Portfolio — profile, experience, certifications, lab log, projects |
| `/about` | Full story |
| `/docs` | Docs entry — the documentation drawn as a network topology |
| `/docs/labs`, `/docs/projects`, `/docs/ccna-labs` | Lab write-ups & project docs (Fumadocs) |
| `/blog` | Blog (standalone route, violet accent) |
| `/rss.xml`, `/sitemap.xml`, `/robots.txt` | Feeds & crawlers |
| `/llms.txt`, `/llms-full.txt`, `*.md` | LLM-friendly markdown (content negotiation via `src/proxy.ts`) |

## Stack

- **Next.js** (App Router) + **Tailwind CSS v4**
- **Fumadocs** for `/docs` and `/blog` (MDX authored in Obsidian under `content/`)
- Theming via next-themes (fumadocs RootProvider); portfolio + docs share the
  `.dark` class and `theme` localStorage key
- Vercel Analytics

## Development

```bash
npm install --legacy-peer-deps
npm run dev          # http://localhost:3000
npm run build        # production build
npm run types:check  # fumadocs-mdx + typegen + tsc
```

Set `NEXT_PUBLIC_SITE_URL=https://rajkumarneupane.com` in production so
canonicals, the sitemap, RSS, and OG images use the right origin (falls back
to the Vercel production URL).

## Connect

- **LinkedIn**: [in/rjneupane](https://www.linkedin.com/in/rjneupane)
- **GitHub**: [raiz-toff](https://github.com/raiz-toff)

---

*Crafted with Curiosity by Rajkumar Neupane.*
