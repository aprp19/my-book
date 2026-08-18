# Deployment — Personal Manga Reader

## Vercel

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (production URL, e.g. `https://your-app.vercel.app`)
4. Deploy.

## Supabase

1. Run [supabase/migrations/001_initial.sql](supabase/migrations/001_initial.sql) in the Supabase SQL editor.
2. Enable Google OAuth under Authentication → Providers (optional).
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-app.vercel.app/auth/callback`

## Smoke test checklist

- [ ] Login (email or Google)
- [ ] Search manga
- [ ] Open manga detail and chapter list
- [ ] Read a chapter (vertical scroll)
- [ ] Favorite a manga
- [ ] Reopen home → Continue Reading, History, Favorites
- [ ] Resume from saved page after reload

## Notes

- Manga images load from external CDNs (ComicK, MangaDex). No image proxy is used.
- Apply the SQL migration before testing authenticated features.
