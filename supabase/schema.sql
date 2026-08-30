-- =========================================================================
-- TEMPO SUPABASE POSTGRESQL DATABASE SCHEMA
-- Strictly follows STANDARDS.md (No emojis, production-grade security & indexes)
-- =========================================================================

-- 1. PROFILES TABLE (Linked with Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text default 'Listener',
  avatar_url text default 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Auto create profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', 'Listener'),
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. LIKED SONGS TABLE
create table if not exists public.liked_songs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  song_id text not null, -- e.g. zing_Z12345 or audius_A12345
  title text not null,
  artists_names text not null,
  thumbnail text default '',
  duration integer default 0,
  source text default 'zing' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, song_id)
);

create index if not exists idx_liked_songs_user on public.liked_songs(user_id, created_at desc);

-- 3. CUSTOM PLAYLISTS TABLE
create table if not exists public.playlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text default '',
  cover_url text default '',
  is_public boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_playlists_user on public.playlists(user_id, created_at desc);

-- 4. PLAYLIST SONGS TABLE (With position ordering)
create table if not exists public.playlist_songs (
  id uuid default gen_random_uuid() primary key,
  playlist_id uuid references public.playlists(id) on delete cascade not null,
  song_id text not null,
  title text not null,
  artists_names text not null,
  thumbnail text default '',
  duration integer default 0,
  source text default 'zing' not null,
  position integer default 0 not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (playlist_id, song_id)
);

create index if not exists idx_playlist_songs_ordering on public.playlist_songs(playlist_id, position asc);

-- 5. LISTENING HISTORY TABLE
create table if not exists public.listening_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  song_id text not null,
  title text not null,
  artists_names text not null,
  thumbnail text default '',
  duration integer default 0,
  source text default 'zing' not null,
  played_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_listening_history_user on public.listening_history(user_id, played_at desc);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
alter table public.profiles enable row level security;
alter table public.liked_songs enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_songs enable row level security;
alter table public.listening_history enable row level security;

-- Profiles: Public can view, only owner can update
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Liked Songs: Only owner can view, insert, delete
create policy "Users can view own liked songs" on public.liked_songs for select using (auth.uid() = user_id);
create policy "Users can insert own liked songs" on public.liked_songs for insert with check (auth.uid() = user_id);
create policy "Users can delete own liked songs" on public.liked_songs for delete using (auth.uid() = user_id);

-- Playlists: Public playlists viewable by all, private only by owner
create policy "Users can view own and public playlists" on public.playlists for select using (auth.uid() = user_id or is_public = true);
create policy "Users can insert own playlists" on public.playlists for insert with check (auth.uid() = user_id);
create policy "Users can update own playlists" on public.playlists for update using (auth.uid() = user_id);
create policy "Users can delete own playlists" on public.playlists for delete using (auth.uid() = user_id);

-- Playlist Songs: Linked to playlist access
create policy "View playlist songs" on public.playlist_songs for select using (
  exists (select 1 from public.playlists where id = playlist_songs.playlist_id and (user_id = auth.uid() or is_public = true))
);
create policy "Insert playlist songs" on public.playlist_songs for insert with check (
  exists (select 1 from public.playlists where id = playlist_songs.playlist_id and user_id = auth.uid())
);
create policy "Delete playlist songs" on public.playlist_songs for delete using (
  exists (select 1 from public.playlists where id = playlist_songs.playlist_id and user_id = auth.uid())
);

-- History: Only owner can view and insert
create policy "Users can view own history" on public.listening_history for select using (auth.uid() = user_id);
create policy "Users can insert own history" on public.listening_history for insert with check (auth.uid() = user_id);
create policy "Users can delete own history" on public.listening_history for delete using (auth.uid() = user_id);
