-- Crowned, step 6. Paste into Supabase > SQL Editor > Run. Safe to run more than once.
-- Counts AI tagging calls per user so one account cannot run up the Gemini bill.

create table if not exists public.tag_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text,
  created_at timestamptz not null default now()
);

create index if not exists tag_calls_user_created_idx on public.tag_calls (user_id, created_at desc);

alter table public.tag_calls enable row level security;

drop policy if exists "tag_calls select own" on public.tag_calls;
drop policy if exists "tag_calls insert own" on public.tag_calls;

create policy "tag_calls select own" on public.tag_calls for select using (auth.uid() = user_id);
create policy "tag_calls insert own" on public.tag_calls for insert with check (auth.uid() = user_id);
