-- Crowned, step 7. Paste into Supabase > SQL Editor > Run. Safe to run more than once.
-- Adds the extra item fields and outfit collections.

alter table public.items add column if not exists brand text;
alter table public.items add column if not exists price numeric;
alter table public.items add column if not exists bought_on date;
alter table public.items add column if not exists notes text;

alter table public.saved_looks add column if not exists collection text;
