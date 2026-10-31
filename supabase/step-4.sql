-- Crowned, step 4. Paste this whole file into Supabase > SQL Editor > Run.
-- Safe to run more than once.

-- 1. Profile settings: style, colours, location and weather.
alter table public.profiles add column if not exists style_prefs text[] not null default '{}';
alter table public.profiles add column if not exists fav_colours text[] not null default '{}';
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists lat double precision;
alter table public.profiles add column if not exists lon double precision;
alter table public.profiles add column if not exists temp_unit text not null default 'C';
alter table public.profiles add column if not exists weather_aware boolean not null default true;

do $$ begin
  alter table public.profiles add constraint profiles_temp_unit_check check (temp_unit in ('C', 'F'));
exception when duplicate_object then null; end $$;

-- 2. Outfit history: every time he taps "I wear this".
create table if not exists public.worn_looks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  occasion text,
  tier text,
  title text,
  item_ids text[] not null default '{}',
  worn_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists worn_looks_user_created_idx on public.worn_looks (user_id, created_at desc);

alter table public.worn_looks enable row level security;

drop policy if exists "worn_looks select own" on public.worn_looks;
drop policy if exists "worn_looks insert own" on public.worn_looks;
drop policy if exists "worn_looks delete own" on public.worn_looks;

create policy "worn_looks select own" on public.worn_looks for select using (auth.uid() = user_id);
create policy "worn_looks insert own" on public.worn_looks for insert with check (auth.uid() = user_id);
create policy "worn_looks delete own" on public.worn_looks for delete using (auth.uid() = user_id);

-- 3. Privacy check. Run these two on their own and look at the results.
--    Every table here should show rowsecurity = true.
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;

--    Every policy here should mention auth.uid() = user_id (or = id for profiles).
select tablename, policyname, cmd, qual, with_check from pg_policies where schemaname = 'public' order by tablename, policyname;
