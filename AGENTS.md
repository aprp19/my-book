# my-book

Personal Manga Reader — search, read, and track manga/manhwa from external providers (ComicK, MangaDex, AniList). Full implementation plan: `PLAN.md — Personal Manga Reader.md`.

## Project overview

- **Stack:** Next.js 16.3, React 19, Tailwind CSS 4, TypeScript, pnpm, shadcn/ui, Zustand
- **Layout:** App Router under `src/app/`
- **Backend:** Supabase Auth + PostgreSQL (favorites, reading progress, manga view history only — no image/catalog mirroring)
- **Commands:** `pnpm dev`, `pnpm build`, `pnpm lint`

## Agent skills

Skills live in `.agents/skills/`. For specialized work, read each skill's `SKILL.md` first (progressive disclosure). Only load a skill's compiled `AGENTS.md` when the quick reference is insufficient.

| Task | Skill | Path |
| --- | --- | --- |
| Building/redesigning UI with distinctive visual direction | frontend-design | `.agents/skills/frontend-design/SKILL.md` |
| Supabase (DB, Auth, RLS, migrations, SSR, Edge Functions, logs) | supabase | `.agents/skills/supabase/SKILL.md` |
| UI/UX decisions, design systems, stack-specific UI guidance | ui-ux-pro-max | `.agents/skills/ui-ux-pro-max/SKILL.md` |
| React component architecture, boolean props, compound components | vercel-composition-patterns | `.agents/skills/vercel-composition-patterns/SKILL.md` |
| React/Next.js performance, data fetching, bundle size | vercel-react-best-practices | `.agents/skills/vercel-react-best-practices/SKILL.md` |
| UI/accessibility audit against Web Interface Guidelines | web-design-guidelines | `.agents/skills/web-design-guidelines/SKILL.md` |

Installed skill versions are tracked in `skills-lock.json`. Update with `npx skills check` / `npx skills update`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
