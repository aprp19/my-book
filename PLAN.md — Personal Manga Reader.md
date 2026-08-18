# Personal Manga Reader — Implementation Plan

## 1. Project Goal

Build a personal manga/manhwa reader for a single primary user.

The application should:

- Search manga/manhwa from external providers.
- Display manga metadata.
- Display available chapters.
- Open chapters in a reader.
- Load page images directly from external providers.
- Track reading progress.
- Save favorite manga.
- Support multiple manga providers.
- Avoid storing manga chapter images locally.
- Avoid mirroring entire manga catalogs into Supabase.
- Deploy the application to Vercel.
- Use Supabase for authentication and personal user data.

This is a personal-use application, not a public manga hosting platform.

---

# 2. Technology Stack

## Core

- Next.js 16.3
- TypeScript
- React
- App Router
- Vercel

## UI

- Tailwind CSS
- shadcn/ui
- Lucide Icons

## Client State

- Zustand

Use Zustand only for client-side application state.

Do not use Zustand as a replacement for server-side persistence.

## Backend

Use Next.js Route Handlers as the BFF/API layer.

Do NOT create a separate Go backend for the initial implementation.

## Database / Auth

- Supabase PostgreSQL
- Supabase Auth
- Supabase Row Level Security

## Manga Providers

Initial providers:

1. ComicK
2. MangaDex
3. AniList

Provider implementations must be isolated behind a common interface.

---

# 3. Architecture

```text
                           Vercel
                  ┌─────────────────────┐
                  │      Next.js        │
                  │                     │
                  │  App Router        │
                  │  Server Components │
                  │  Client Components │
                  │  Route Handlers    │
                  └──────────┬──────────┘
                             │
               ┌─────────────┴─────────────┐
               │                           │
               ▼                           ▼
        ┌──────────────┐           ┌──────────────┐
        │   Supabase   │           │   Providers  │
        │              │           │              │
        │ Auth         │           │ ComicK       │
        │ PostgreSQL   │           │ MangaDex     │
        │ RLS          │           │ AniList      │
        └──────────────┘           └──────────────┘
```

The application must NOT download and permanently store manga images.

Page images should be loaded from the provider/CDN whenever possible.

---

# 4. Core Principles

## 4.1 Provider Agnostic

UI components must never directly depend on ComicK, MangaDex, or AniList response structures.

Bad:

```ts
const title = comickData.mdTitle;
```

Good:

```ts
const manga = await provider.getManga(id);

return <MangaTitle title={manga.title} />;
```

Provider-specific transformations belong inside the provider implementation.

---

## 4.2 Normalize External Data

All providers must return the application's internal domain models.

Example:

```ts
interface Manga {
  id: string;
  provider: MangaProviderType;
  title: string;
  altTitles: string[];
  description: string | null;
  coverUrl: string | null;
  author: string | null;
  artist: string | null;
  status: MangaStatus | null;
  genres: string[];
}
```

The UI should never know how the provider represents these fields.

---

## 4.3 External IDs

Never assume IDs from different providers are interchangeable.

Always keep:

```ts
provider
externalId
```

Example:

```text
provider = comick
externalId = abc123

provider = mangadex
externalId = 550e8400-e29b-41d4-a716-446655440000
```

---

# 5. Project Structure

Use a clean feature-oriented structure.

Recommended:

```text
src/
├── app/
│   ├── page.tsx
│   │
│   ├── search/
│   │   └── page.tsx
│   │
│   ├── manga/
│   │   └── [provider]/
│   │       └── [id]/
│   │           └── page.tsx
│   │
│   ├── read/
│   │   └── [provider]/
│   │       └── [chapterId]/
│   │           └── page.tsx
│   │
│   └── api/
│       ├── search/
│       │   └── route.ts
│       │
│       ├── manga/
│       │   └── [provider]/
│       │       └── [id]/
│       │           ├── route.ts
│       │           └── chapters/
│       │               └── route.ts
│       │
│       └── chapter/
│           └── [provider]/
│               └── [id]/
│                   └── pages/
│                       └── route.ts
│
├── components/
│   ├── ui/
│   │
│   ├── manga/
│   │   ├── manga-card.tsx
│   │   ├── manga-grid.tsx
│   │   ├── manga-header.tsx
│   │   └── manga-metadata.tsx
│   │
│   ├── chapter/
│   │   ├── chapter-list.tsx
│   │   └── chapter-item.tsx
│   │
│   └── reader/
│       ├── reader.tsx
│       ├── reader-page.tsx
│       ├── reader-controls.tsx
│       └── reader-progress.tsx
│
├── lib/
│   ├── providers/
│   │   ├── types.ts
│   │   ├── registry.ts
│   │   ├── comick.ts
│   │   ├── mangadex.ts
│   │   └── anilist.ts
│   │
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   │
│   ├── cache/
│   │   └── ...
│   │
│   └── utils/
│       └── ...
│
├── stores/
│   ├── reader-store.ts
│   └── ui-store.ts
│
├── types/
│   ├── manga.ts
│   ├── chapter.ts
│   └── reader.ts
│
└── middleware.ts
```

---

# 6. Domain Models

## Manga

```ts
interface Manga {
  id: string;
  provider: MangaProviderType;
  title: string;
  altTitles: string[];
  description: string | null;
  coverUrl: string | null;
  author: string | null;
  artist: string | null;
  status: MangaStatus | null;
  genres: string[];
}
```

## Chapter

```ts
interface Chapter {
  id: string;
  mangaId: string;
  provider: MangaProviderType;
  number: string | null;
  title: string | null;
  volume: string | null;
  language: string | null;
  publishedAt: string | null;
}
```

## Page

```ts
interface Page {
  index: number;
  imageUrl: string;
}
```

## Provider

```ts
type MangaProviderType =
  | "comick"
  | "mangadex"
  | "anilist";
```

---

# 7. Provider Interface

Create:

```text
src/lib/providers/types.ts
```

Interface:

```ts
interface MangaProvider {
  readonly type: MangaProviderType;

  search(query: string): Promise<Manga[]>;

  getManga(id: string): Promise<Manga>;

  getChapters(mangaId: string): Promise<Chapter[]>;

  getPages(chapterId: string): Promise<Page[]>;
}
```

Provider implementations:

```text
ComicKProvider
MangaDexProvider
AniListProvider
```

---

# 8. Provider Responsibilities

## ComicK

Primary provider for manga/manhwa discovery and chapters.

Responsibilities:

- Search
- Manga details
- Chapter list
- Chapter pages

Normalize all ComicK responses into application domain models.

Do not expose raw ComicK responses to UI components.

---

## MangaDex

Secondary provider.

Responsibilities:

- Search
- Manga details
- Chapter list
- Chapter pages

Use MangaDex's chapter/page mechanism for retrieving page images.

---

## AniList

Metadata provider.

Use primarily for:

- title
- alternative titles
- description
- cover
- genres
- author
- status
- relationships

Do NOT assume AniList provides chapter page images.

---

# 9. Provider Registry

Create:

```text
src/lib/providers/registry.ts
```

Example API:

```ts
getProvider("comick");
getProvider("mangadex");
getProvider("anilist");
```

Do not instantiate providers repeatedly if they are stateless.

Provider selection should be centralized.

---

# 10. API Routes

Use Next.js Route Handlers.

## Search

```http
GET /api/search?q=solo%20leveling
```

Response:

```json
{
  "data": [
    {
      "id": "abc",
      "provider": "comick",
      "title": "Solo Leveling",
      "coverUrl": "..."
    }
  ]
}
```

---

## Manga Details

```http
GET /api/manga/comick/abc
```

---

## Chapters

```http
GET /api/manga/comick/abc/chapters
```

---

## Pages

```http
GET /api/chapter/comick/xyz/pages
```

Response:

```json
{
  "data": [
    {
      "index": 0,
      "imageUrl": "https://..."
    }
  ]
}
```

---

# 11. API Error Handling

Never leak raw provider errors to the browser.

Bad:

```json
{
  "error": "AxiosError: Request failed with status code 429..."
}
```

Use normalized errors:

```json
{
  "error": {
    "code": "PROVIDER_RATE_LIMITED",
    "message": "Manga provider is temporarily unavailable."
  }
}
```

Recommended error codes:

```text
PROVIDER_UNAVAILABLE
PROVIDER_RATE_LIMITED
MANGA_NOT_FOUND
CHAPTER_NOT_FOUND
PAGES_NOT_FOUND
INVALID_PROVIDER
VALIDATION_ERROR
UNAUTHORIZED
INTERNAL_ERROR
```

---

# 12. Caching

External provider data should be cached where appropriate.

Good candidates:

- Search results
- Manga metadata
- Chapter lists

Do not aggressively cache:

- User-specific progress
- Favorites

Chapter page lists can be cached temporarily.

Avoid implementing Redis for the initial version.

Use Next.js caching/revalidation first.

---

# 13. Supabase

Supabase is only for user-specific persistent data.

Do NOT use Supabase as a manga mirror.

Do NOT store:

- Manga images
- Chapter images
- Entire provider catalogs
- Every chapter from every manga

---

# 14. Database Schema

Initial schema:

## profiles

```sql
id uuid primary key references auth.users(id) on delete cascade,
created_at timestamptz not null default now()
```

Only add profile fields when actually required.

---

## favorites

```sql
id uuid primary key default gen_random_uuid(),

user_id uuid not null
  references auth.users(id)
  on delete cascade,

provider text not null,

external_manga_id text not null,

title text not null,

cover_url text,

created_at timestamptz not null default now(),

unique(user_id, provider, external_manga_id)
```

---

## reading_progress

```sql
id uuid primary key default gen_random_uuid(),

user_id uuid not null
  references auth.users(id)
  on delete cascade,

provider text not null,

external_manga_id text not null,

external_chapter_id text not null,

chapter_number text,

page integer not null default 0,

updated_at timestamptz not null default now(),

unique(
  user_id,
  provider,
  external_chapter_id
)
```

Add an index:

```sql
create index idx_reading_progress_user_updated
on reading_progress(user_id, updated_at desc);
```

---

# 15. Row Level Security

Enable RLS on all user-owned tables.

Users must only access their own records.

Example:

```sql
create policy "Users can manage their own favorites"
on favorites
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

Same principle for `reading_progress`.

Never trust `user_id` supplied by the client.

The authenticated Supabase session must determine the user.

---

# 16. Authentication

Use Supabase Auth.

Initial login options:

- Google OAuth
- Email/password

Keep authentication simple.

Do not build a custom authentication system.

The application should support:

```text
Unauthenticated
    ↓
Login
    ↓
Authenticated
    ↓
Library / History / Reader
```

---

# 17. Favorites

Favorite flow:

```text
Manga Detail
     ↓
Favorite button
     ↓
Supabase
     ↓
favorites
```

The UI should optimistically update when appropriate, but revert the state if the request fails.

Prevent duplicate favorites using the database unique constraint.

---

# 18. Reading Progress

Reader should save:

```text
manga
provider
chapter
page
updatedAt
```

Progress should not be written to Supabase on every scroll event.

Bad:

```text
scroll
 ↓
UPDATE Supabase
 ↓
scroll
 ↓
UPDATE Supabase
```

Instead:

```text
scroll
 ↓
local state
 ↓
debounce
 ↓
Supabase
```

Suggested debounce:

```text
500ms - 1500ms
```

Also save when:

- leaving reader
- changing chapter
- browser visibility changes
- reader reaches the end

---

# 19. Reader

The reader should default to vertical/webtoon mode.

Requirements:

- Vertical continuous scrolling
- Dark background
- Centered images
- Responsive width
- Lazy image loading
- Preload nearby pages
- Remember current page
- Previous chapter
- Next chapter
- Chapter selector
- Keyboard navigation
- Reading progress indicator

---

# 20. Image Loading

Images remain hosted by external providers.

Do not download and store them permanently.

Example:

```text
Next.js
   ↓
Page metadata
   ↓
imageUrl
   ↓
External CDN
```

Do not implement an open image proxy.

If an image proxy becomes necessary, only allow explicitly configured provider domains.

Never create:

```text
/api/proxy?url=https://anything.com
```

This can become an SSRF/security vulnerability.

---

# 21. Image Performance

Use browser-native lazy loading for pages outside the viewport.

Concept:

```tsx
<img
  src={page.imageUrl}
  loading="lazy"
  decoding="async"
/>
```

For the first visible pages, prioritize loading.

Do not eagerly load 100+ pages simultaneously.

Use an IntersectionObserver or equivalent strategy to preload only nearby pages.

---

# 22. Reader State

Create Zustand reader state.

Example:

```ts
interface ReaderState {
  currentPage: number;
  totalPages: number;

  setCurrentPage(page: number): void;

  nextPage(): void;

  previousPage(): void;

  reset(): void;
}
```

Do not store provider API response objects in Zustand unnecessarily.

Keep server data and UI state separate.

---

# 23. Continue Reading

Home page should have:

```text
Continue Reading
```

Example:

```text
Solo Leveling
Chapter 200
Page 37

Eleceed
Chapter 381
Page 12
```

Sort by:

```text
updated_at DESC
```

---

# 24. Home Page

Initial home page:

```text
┌─────────────────────────────────┐
│ Personal Manga Reader           │
│                                 │
│ Search manga...                 │
│                                 │
├─────────────────────────────────┤
│ Continue Reading                │
│                                 │
│ [Manga] [Manga] [Manga]         │
│                                 │
├─────────────────────────────────┤
│ Favorites                       │
│                                 │
│ [Manga] [Manga] [Manga]         │
└─────────────────────────────────┘
```

Do not implement a complicated recommendation system initially.

---

# 25. Search

Search should:

1. Validate query.
2. Debounce client requests.
3. Call the Next.js API.
4. Query the configured provider.
5. Normalize results.
6. Display provider information.

Avoid calling every provider simultaneously on every keystroke.

Use a deliberate provider strategy.

Example:

```text
Search
 ↓
ComicK
 ↓
results
```

Fallback to MangaDex if required.

---

# 26. Manga Detail Page

Display:

- Cover
- Title
- Alternative titles
- Author
- Artist
- Status
- Genres
- Description
- Favorite button
- Chapter list
- Continue reading button

Chapter list should support:

- Search/filter
- Sort ascending/descending
- Language filter where provider supports it

---

# 27. Chapter Navigation

Reader must support:

```text
Previous Chapter
Current Chapter
Next Chapter
```

Do not require fetching the entire chapter list repeatedly.

Keep chapter list available to the reader route when possible.

---

# 28. Performance Requirements

Initial goals:

- Fast first render
- Minimal client JavaScript
- Server Components by default
- Client Components only where interactivity is required
- Avoid unnecessary global state
- Avoid fetching provider APIs from multiple components
- Avoid duplicate API requests

Use React Server Components for:

- Manga metadata
- Chapter lists
- Static page content

Use Client Components for:

- Reader
- Favorite button
- Search input
- Reading progress
- Interactive controls

---

# 29. Security

Required:

- Validate all route parameters.
- Validate query parameters.
- Never trust provider input.
- Never expose Supabase service-role key to client.
- Use server-side Supabase client where privileged operations are required.
- Enable RLS.
- Do not expose arbitrary URL proxying.
- Do not log authentication tokens.
- Do not expose provider credentials in client bundles.
- Handle provider rate limits gracefully.

Environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Only server-side secrets should use non-public environment variables.

---

# 30. Rate Limiting

Because the app is personal-use, do not build a complicated distributed rate limiter initially.

However:

- Avoid duplicate provider calls.
- Cache metadata.
- Debounce search.
- Handle HTTP 429.
- Respect provider rate limits.
- Implement exponential backoff only where appropriate.

Do not automatically retry aggressively.

---

# 31. Error UX

Provider failure should not crash the application.

Example:

```text
Unable to load chapters.

[MangaDex is temporarily unavailable]

Retry
```

Reader image failure:

```text
Failed to load page 37.

Retry
```

Do not display raw stack traces.

---

# 32. Testing

At minimum:

## Unit tests

Test provider normalization.

```text
ComicK response
    ↓
normalize
    ↓
Manga
```

Test:

- Missing title
- Missing cover
- Missing author
- Empty chapter list
- Invalid page URL
- Provider error
- Rate limit

## Integration tests

Test:

```text
Search
Manga detail
Chapter list
Chapter pages
Favorites
Reading progress
```

## E2E

Test critical flow:

```text
Login
 ↓
Search manga
 ↓
Open manga
 ↓
Open chapter
 ↓
Read
 ↓
Reload
 ↓
Continue from previous position
```

---

# 33. Development Phases

## Phase 1 — Foundation

- [ ] Initialize Next.js 16.3 project.
- [ ] Configure TypeScript.
- [ ] Configure Tailwind.
- [ ] Configure shadcn/ui.
- [ ] Configure ESLint.
- [ ] Create project structure.
- [ ] Create environment configuration.
- [ ] Create base domain types.

---

## Phase 2 — Provider Architecture

- [ ] Create `MangaProvider` interface.
- [ ] Create provider registry.
- [ ] Implement ComicK provider.
- [ ] Implement MangaDex provider.
- [ ] Implement AniList metadata provider.
- [ ] Normalize provider responses.
- [ ] Add provider error handling.
- [ ] Add basic caching.

---

## Phase 3 — API Layer

- [ ] Implement search API.
- [ ] Implement manga detail API.
- [ ] Implement chapters API.
- [ ] Implement pages API.
- [ ] Normalize API response format.
- [ ] Add validation.
- [ ] Add error handling.
- [ ] Handle provider rate limits.

---

## Phase 4 — Supabase

- [ ] Create Supabase project.
- [ ] Configure Auth.
- [ ] Create database schema.
- [ ] Enable RLS.
- [ ] Add favorites table.
- [ ] Add reading_progress table.
- [ ] Create server/client Supabase helpers.
- [ ] Implement auth middleware.

---

## Phase 5 — UI

- [ ] Build application shell.
- [ ] Build navbar.
- [ ] Build search page.
- [ ] Build manga cards.
- [ ] Build manga detail page.
- [ ] Build chapter list.
- [ ] Build favorite button.
- [ ] Build continue-reading section.

---

## Phase 6 — Reader

- [ ] Build vertical reader.
- [ ] Load chapter pages.
- [ ] Lazy load images.
- [ ] Preload nearby pages.
- [ ] Track current page.
- [ ] Save reading progress.
- [ ] Restore reading progress.
- [ ] Previous/next chapter.
- [ ] Reader keyboard shortcuts.
- [ ] Reader controls.
- [ ] Mobile responsive layout.

---

## Phase 7 — Polish

- [ ] Loading skeletons.
- [ ] Error states.
- [ ] Empty states.
- [ ] Image failure handling.
- [ ] Dark mode.
- [ ] Responsive mobile UI.
- [ ] Performance optimization.
- [ ] Accessibility review.

---

## Phase 8 — Deployment

- [ ] Configure Vercel.
- [ ] Configure production environment variables.
- [ ] Configure Supabase production project.
- [ ] Test authentication.
- [ ] Test provider APIs.
- [ ] Test reading progress.
- [ ] Test mobile reader.
- [ ] Deploy.

---

# 34. Explicit Non-Goals

Do NOT implement these in the initial version:

- Go backend
- Microservices
- Redis
- Kafka
- RabbitMQ
- Elasticsearch
- Kubernetes
- Image storage
- Manga mirroring
- Public upload system
- Admin dashboard
- Recommendation engine
- Social features
- Comments
- Ratings
- Public user profiles
- Complex analytics
- Background workers

Keep the application simple.

---

# 35. Definition of Done

The project is considered MVP-complete when Mas Angga can:

1. Open the website.
2. Log in.
3. Search for a manga/manhwa.
4. Open manga details.
5. View available chapters.
6. Open a chapter.
7. Read pages in vertical mode.
8. Navigate between chapters.
9. Favorite a manga.
10. Close the browser.
11. Reopen the website.
12. See the manga in Continue Reading.
13. Resume from the previous page.

The application must not store manga images locally.

The application must not require a separate backend server.

The application must be deployable directly to Vercel.

---

# 36. Engineering Rules for Cursor

When implementing this plan:

1. Prefer simple solutions over abstractions that are not currently needed.
2. Keep provider-specific code isolated.
3. Never leak provider response structures into UI components.
4. Prefer Server Components by default.
5. Use Client Components only for interactive behavior.
6. Keep Supabase access isolated from presentation components.
7. Never expose service-role credentials.
8. Never implement an unrestricted URL proxy.
9. Do not introduce a new dependency unless it solves a real problem.
10. Do not add a database table unless the feature requires persistent data.
11. Do not store external manga data unnecessarily.
12. Do not store manga images.
13. Handle provider failures gracefully.
14. Handle rate limits.
15. Validate all external input.
16. Keep TypeScript strict.
17. Avoid `any`.
18. Prefer small composable functions.
19. Keep business logic outside React components.
20. Do not over-engineer the MVP.

---

# 37. Final Architecture

```text
                         ┌───────────────┐
                         │    Vercel     │
                         │               │
                         │ Next.js 16.3  │
                         │ TypeScript    │
                         └───────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
             ┌─────────────┐          ┌─────────────┐
             │  Supabase   │          │  Providers  │
             │             │          │             │
             │ Auth        │          │ ComicK      │
             │ PostgreSQL  │          │ MangaDex    │
             │ RLS         │          │ AniList     │
             └─────────────┘          └──────┬──────┘
                                             │
                                             ▼
                                      External CDN
                                      Manga Images
```

The core philosophy:

```text
Supabase = "What Mas Angga has read/saved"

Providers = "What manga exists"

Vercel = "Application"

External CDN = "Manga pages"

No unnecessary storage.
No unnecessary backend.
No unnecessary infrastructure.
