# my-book — Design System

Warm dark-only UI for a personal manga/manhwa reader. Optimized for long reading sessions, cover-first browsing, mobile use, and low eye strain.

**When building or changing UI, read this file first.** Implementation plan phases live in the warm-dark UI overhaul plan; this document is the source of truth for visual and interaction decisions.

---

## Principles

1. **Warm dark only** — no light mode. Soft ink backgrounds, never pure black or harsh white.
2. **Cover art first** — grids and carousels prioritize covers; metadata stays secondary.
3. **Mobile first** — 44px minimum touch targets, bottom nav on small screens, filters in sheets not cramped toolbars.
4. **Calm density** — fewer columns on phone, horizontal snap carousels instead of endless vertical grids where appropriate.
5. **Visible focus** — accent-colored focus rings on all interactive elements; respect `prefers-reduced-motion`.
6. **Plain copy** — sentence case, active voice, helpful empty/error states (see frontend-design skill).

---

## Color tokens

Map these to CSS variables in `src/app/globals.css`. Use oklch for consistency with Tailwind 4 / shadcn.

| Token | Value | Maps to | Usage |
| --- | --- | --- | --- |
| `ink` | `oklch(0.17 0.012 55)` | `--background` | Page background |
| `surface` | `oklch(0.22 0.014 55)` | `--card` | Cards, panels |
| `surface-raised` | `oklch(0.26 0.016 55)` | `--secondary`, `--muted` | Inputs, hover states |
| `text` | `oklch(0.92 0.01 80)` | `--foreground` | Primary copy |
| `text-muted` | `oklch(0.72 0.02 70)` | `--muted-foreground` | Secondary copy, captions |
| `accent` | `oklch(0.78 0.12 55)` | `--primary` | Links, active filters, focus rings, primary buttons |
| `accent-foreground` | `oklch(0.17 0.012 55)` | `--primary-foreground` | Text on accent surfaces |
| `border` | `oklch(1 0 0 / 8%)` | `--border` | Dividers, card edges |
| `reader-ink` | `oklch(0.12 0.01 55)` | local / reader only | Reader page background (deepest) |

Destructive and chart tokens may keep shadcn defaults adjusted for warm hue if needed.

**Do not** introduce cool gray defaults, acid green accents, or cream/light backgrounds.

---

## Typography

| Role | Font | Usage |
| --- | --- | --- |
| UI / body | IBM Plex Sans | All interface text, buttons, labels, chapter lists |
| Display | IBM Plex Serif | Page titles only (`h1`, hero headings) |
| Mono | Geist Mono | IDs, debug (existing) |

Load via `next/font/google` in `src/app/layout.tsx`.

| Scale | Class | Use |
| --- | --- | --- |
| Page title | `text-2xl md:text-3xl font-serif font-semibold` | One per page |
| Section title | `text-xl font-semibold` | Discover rows, library blocks |
| Subsection | `text-sm font-medium text-muted-foreground` | Labels above lists |
| Body | `text-base` (16px) | Default; line-height 1.5 |
| Caption | `text-xs text-muted-foreground` | Timestamps, provider on detail only |

---

## Spacing and layout

### Page container

Use `AppShell` (when implemented) or this pattern:

```tsx
<div className="page-container mx-auto w-full max-w-6xl px-4 pb-24 pt-6 md:pb-10 md:pt-10">
```

- `pb-24` on mobile clears fixed bottom nav.
- Max width `6xl`; do not invent new max-widths per page.

### Grid breakpoints (manga covers)

| Breakpoint | Columns | Gap |
| --- | --- | --- |
| default | 2 | `gap-3` |
| `sm` | 3 | `gap-4` |
| `lg` | 4 | — |
| `xl` | 5 | — |

Cover aspect ratio: `aspect-[2/3]`. Border radius: `rounded-xl` on cards.

### Carousels (mobile signature)

On viewports `< md`, discover and continue-reading rows use horizontal snap scroll:

```tsx
<div className="cover-carousel flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 md:grid md:overflow-visible md:snap-none">
  {/* items: snap-start shrink-0 w-[140px] md:w-auto */}
</div>
```

Define `.cover-carousel` in `globals.css` with `scrollbar-width: thin` and hidden scrollbar optional.

---

## Navigation

### Top bar (`Navbar`)

- Sticky, `backdrop-blur`, border-bottom
- Logo (home), Browse + Library links (desktop only), account avatar / login
- Height ~56px (`h-14`)

### Bottom nav (mobile only, `< md`)

Fixed bottom, 4 items:

| Item | Route / action |
| --- | --- |
| Home | `/` |
| Browse | `/browse` |
| Library | `/library` |
| Account | `/account` when signed in, `/login` when signed out |

Active state: accent color + label weight. Safe area: `pb-[env(safe-area-inset-bottom)]`.

---

## Components

### Layout primitives (target paths)

| Component | Path | Purpose |
| --- | --- | --- |
| `AppShell` | `src/components/layout/app-shell.tsx` | Page wrapper, title, description |
| `PageHeader` | `src/components/layout/page-header.tsx` | Title + actions |
| `SectionHeader` | `src/components/layout/section-header.tsx` | Section title + optional "See all" |
| `BottomNav` | `src/components/layout/bottom-nav.tsx` | Mobile tab bar |
| `EmptyState` | `src/components/ui/empty-state.tsx` | Icon, message, CTA |
| `FilterSheet` | `src/components/ui/filter-sheet.tsx` | Mobile filter drawer |

Prefer these over ad-hoc page markup.

### Browse filters

Split from monolithic `browse-filters.tsx`:

| Piece | Behavior |
| --- | --- |
| `BrowseFilterBar` | Search, sort, status, type, safe mode toggle, "Filters" button with count badge |
| `BrowseFilterSheet` | Genres include/exclude, advanced toggles; Sheet on mobile, collapsible panel on `md+` |
| `BrowseActiveChips` | Removable chips reflecting URL params above results |

Filters sync to URL; fetch on change (debounced search on browse page). Sticky bar below top nav on `/browse`.

### Manga card

- Cover fills top; title `line-clamp-2` below
- **No provider badge on cards** — show provider on detail page only
- Subtitle optional (progress, date)
- Hover: subtle border accent, cover scale `1.02`

### Empty and error states

- Never blank screens — use `EmptyState` with next action
- Errors: border destructive/30, bg destructive/5, plain explanation + retry if applicable
- Signed-out library: CTA to sign in, not `return null`

---

## Page patterns

### Home (`/`)

1. Compact hero: search field + "Browse all" link (not full filter bar)
2. Discover rows: Recently Added, Latest Updates, Popular (carousel mobile / grid desktop)
3. Link to Library for saved progress when signed out

### Library (`/library`)

1. Page header: "My Library"
2. Continue Reading — horizontal carousel with progress subtitle
3. History — recently read list + recently viewed carousel
4. Favorites — carousel
5. Signed-out: `EmptyState` with sign-in CTA

### Browse (`/browse`)

1. Sticky filter bar
2. Active chips
3. Results grid + subtle fetching indicator (`keepPreviousData`)
4. Touch-friendly pagination

### Manga detail

- Mobile: full-width cover hero, stacked metadata
- Desktop: cover column + content column
- Mobile sticky footer: Read latest + Favorite
- Chapter list: `min-h-12` rows, language badges

### Reader (`/read/...`)

- Background `reader-ink` (deeper than app shell)
- Minimal chrome; controls auto-hide
- Large tap zones for prev/next on mobile
- Progress bar at bottom
- **Do not** change progress save logic when restyling

### Login

- Centered card on `surface`
- Visible field labels (not placeholder-only)
- Inline errors

### Account (`/account`)

- Redirect to `/login` when signed out
- Card layout matching login: read-only email, editable display name, optional password change
- OAuth users: hide password fields; show “managed by sign-in provider” copy
- Danger zone: type email or `DELETE` to confirm; deletes auth user (cascades all app data) then signs out

---

## Accessibility and motion

- Minimum touch target: **44×44px** on mobile (`h-11` buttons/inputs)
- Body text contrast ≥ 4.5:1 against background
- Focus: `ring-2 ring-primary ring-offset-2 ring-offset-background`
- `prefers-reduced-motion: reduce` — disable cover hover scale and nonessential transitions
- Genre chips: wrap (`flex-wrap`), never single-line clip with hidden overflow
- Icon-only buttons: `aria-label` required

---

## shadcn / Tailwind conventions

- Extend existing shadcn components in `src/components/ui/`; do not fork unnecessarily
- Use semantic tokens (`bg-background`, `text-muted-foreground`) not raw hex in components
- `--radius`: `0.75rem` default
- Dark class stays on `<html>`; no theme toggle

---

## Out of scope for UI work

Do not change unless explicitly requested:

- TanStack Query keys and fetch logic
- API routes and provider adapters (Mgeko, etc.)
- Supabase schema, RLS, auth actions
- URL param schema for browse filters

---

## Verification checklist

Before marking UI work done:

- [ ] 375px, 768px, 1280px layouts checked (home, browse, detail, reader, login)
- [ ] Bottom nav visible and tappable on mobile
- [ ] Filter sheet opens; chips match URL; results update on filter change
- [ ] Focus visible on keyboard tab through interactive elements
- [ ] `pnpm build` and `pnpm lint` pass
