-- Initial schema for Personal Manga Reader

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  external_manga_id text not null,
  title text not null,
  cover_url text,
  created_at timestamptz not null default now(),
  unique(user_id, provider, external_manga_id)
);

create table if not exists reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  external_manga_id text not null,
  external_chapter_id text not null,
  chapter_number text,
  manga_title text,
  page integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, provider, external_chapter_id)
);

create index if not exists idx_reading_progress_user_updated
  on reading_progress(user_id, updated_at desc);

create table if not exists manga_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  external_manga_id text not null,
  title text not null,
  cover_url text,
  viewed_at timestamptz not null default now(),
  unique(user_id, provider, external_manga_id)
);

create index if not exists idx_manga_views_user_viewed
  on manga_views(user_id, viewed_at desc);

alter table profiles enable row level security;
alter table favorites enable row level security;
alter table reading_progress enable row level security;
alter table manga_views enable row level security;

create policy "Users can manage their own profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can manage their own favorites"
  on favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own reading progress"
  on reading_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own manga views"
  on manga_views for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
