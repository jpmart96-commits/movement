-- Practice Brain — Supabase Schema
-- Run this in the SQL Editor in your Supabase project

-- Profile table (one row per user)
create table if not exists profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- Sessions table
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_key text not null,  -- matches localStorage key e.g. "session_1234567890"
  data jsonb not null default '{}',
  date timestamptz not null,
  theme text,
  duration integer,
  updated_at timestamptz default now(),
  unique(user_id, session_key)
);

-- Custom exercises table
create table if not exists custom_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  exercise_id text not null,  -- matches custom.js id e.g. "custom_ex_1234"
  data jsonb not null default '{}',
  updated_at timestamptz default now(),
  unique(user_id, exercise_id)
);

-- Custom goals table
create table if not exists custom_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  goal_id text not null,
  data jsonb not null default '{}',
  updated_at timestamptz default now(),
  unique(user_id, goal_id)
);

-- Overrides table (built-in exercise edits + goal overrides)
create table if not exists overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  store_key text not null,  -- e.g. "library_overrides", "goal_overrides", "goal_milestone_overrides"
  data jsonb not null default '{}',
  updated_at timestamptz default now(),
  unique(user_id, store_key)
);

-- Session index (lightweight list for History screen)
create table if not exists session_index (
  user_id uuid references auth.users(id) on delete cascade not null primary key,
  data jsonb not null default '[]',
  updated_at timestamptz default now()
);

-- Exercise + goal cache (last logged, stale tracking)
create table if not exists cache (
  user_id uuid references auth.users(id) on delete cascade not null,
  cache_key text not null,  -- "ex_cache" or "goal_cache"
  data jsonb not null default '{}',
  updated_at timestamptz default now(),
  unique(user_id, cache_key)
);

-- ── SCAFFOLD REVAMP (2026-08) ────────────────────────────────────
-- See memory: project_scaffold_revamp — month scaffold + auto-detailed
-- daily instance + in-app chat override, replacing on-demand daily generation.

-- Week scaffold: one row per user, single jsonb blob holding the 7-slot
-- week template (skeleton timing, per-weekday theme, fasting flag, A/B/C
-- variant menu refs). Rarely written — edited only when the user
-- deliberately reshapes their week, not per-day.
create table if not exists week_scaffold (
  user_id uuid references auth.users(id) on delete cascade not null primary key,
  data jsonb not null default '{}',  -- { monday: {theme, fasting, variants:{...}}, tuesday: {...}, ... }
  updated_at timestamptz default now()
);

-- Daily instance: one row per user per calendar date. Generated the first
-- time the app is opened that day by expanding that weekday's scaffold slot
-- (specific exercises + reps/sets/hold-times, tallied to fill the block).
-- Chat overrides mutate this row's `data` in place and append to `chat_log` —
-- always scoped to this single date, never touching week_scaffold.
create table if not exists daily_instances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  weekday text not null,               -- which scaffold slot this was generated from
  correlation_mode text not null default 'correlated',  -- 'correlated' | 'anti_correlated'
  theme_override text,                 -- set when a chat override swaps in a different day-type's theme
  data jsonb not null default '{}',    -- generated blocks: exercises, reps/sets/hold-times, time tally
  chat_log jsonb not null default '[]', -- [{ role, text, applied_change, at }] audit trail of overrides
  generated_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

-- Enable Row Level Security on all tables
alter table profile          enable row level security;
alter table sessions         enable row level security;
alter table custom_exercises enable row level security;
alter table custom_goals     enable row level security;
alter table overrides        enable row level security;
alter table session_index    enable row level security;
alter table cache            enable row level security;
alter table week_scaffold    enable row level security;
alter table daily_instances  enable row level security;

-- RLS Policies: users can only see and edit their own data
create policy "profile: own data"          on profile          for all using (auth.uid() = user_id);
create policy "sessions: own data"         on sessions         for all using (auth.uid() = user_id);
create policy "custom_exercises: own data" on custom_exercises for all using (auth.uid() = user_id);
create policy "custom_goals: own data"     on custom_goals     for all using (auth.uid() = user_id);
create policy "overrides: own data"        on overrides        for all using (auth.uid() = user_id);
create policy "session_index: own data"    on session_index    for all using (auth.uid() = user_id);
create policy "cache: own data"            on cache            for all using (auth.uid() = user_id);
create policy "week_scaffold: own data"    on week_scaffold    for all using (auth.uid() = user_id);
create policy "daily_instances: own data"  on daily_instances  for all using (auth.uid() = user_id);

-- Month plans (js/monthplan.js via js/sync.js, route 'month_plan').
-- Added to this file 26 Sep 2026: the table was used by sync.js but never
-- written down here, so recreating the project would have broken plan sync.
-- Safe to run on a project that already has it.
create table if not exists month_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  block_start date,
  block_end date,
  title text,
  data jsonb not null default '{}',
  updated_at timestamptz default now(),
  unique(user_id, block_start)
);
alter table month_plans enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'month_plans' and policyname = 'month_plans: own data') then
    create policy "month_plans: own data" on month_plans for all using (auth.uid() = user_id);
  end if;
end $$;

-- Plan notes (Notes tab, js/notes.js via js/sync.js, list key 'pb_plan_notes').
-- Added 26 Sep 2026. Free-text memos about training that feed the next
-- rewrite of the plan. One row per note; the whole note is in `data`, and
-- the generated columns exist so a notes review can be a plain query:
--   select note_date, kind, status, body from plan_notes
--   where status = 'open' order by note_date;
-- To mark a note as used, update data (status 'applied' + 'resolution');
-- the app picks that up on its next pull. Safe to run more than once.
create table if not exists plan_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  note_id text not null,
  data jsonb not null default '{}',
  note_date text generated always as (data->>'date') stored,
  kind      text generated always as (data->>'kind') stored,
  status    text generated always as (data->>'status') stored,
  body      text generated always as (data->>'text') stored,
  updated_at timestamptz default now(),
  unique(user_id, note_id)
);
alter table plan_notes enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'plan_notes' and policyname = 'plan_notes: own data') then
    create policy "plan_notes: own data" on plan_notes for all using (auth.uid() = user_id);
  end if;
end $$;

-- Nightly backups (26 Sep 2026). On 20 Sep a recreated auth user
-- cascade-deleted every row, and the free plan keeps no restorable history.
-- `backups` has NO foreign key to auth.users, so a snapshot outlives the
-- user row it was taken for. One row per user per night, last 21 kept.
-- Read-only to the owner through RLS; only the scheduled function writes.
create extension if not exists pg_cron;

create table if not exists public.backups (
  id bigserial primary key,
  user_id uuid not null,
  taken_at timestamptz not null default now(),
  rows int not null default 0,
  data jsonb not null
);
create index if not exists backups_user_time on public.backups (user_id, taken_at desc);
alter table public.backups enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'backups' and policyname = 'backups: own read') then
    create policy "backups: own read" on public.backups for select using (auth.uid() = user_id);
  end if;
end $$;

-- Every public table with a user_id column, except secrets and itself.
create or replace function public.take_backups(keep int default 21) returns int
language plpgsql security definer set search_path = public as $$
declare t text; u uuid; snap jsonb; part jsonb; cnt int; n int; users int := 0;
begin
  for u in select distinct user_id from public.profile loop
    snap := '{}'::jsonb; n := 0;
    for t in
      select c.table_name from information_schema.columns c
      join information_schema.tables tb on tb.table_name = c.table_name and tb.table_schema = c.table_schema
      where c.table_schema = 'public' and c.column_name = 'user_id' and tb.table_type = 'BASE TABLE'
        and c.table_name not in ('backups', 'calendar_tokens')
    loop
      execute format('select coalesce(jsonb_agg(to_jsonb(x) - ''user_id''), ''[]''::jsonb), count(*) from public.%I x where x.user_id = $1', t)
        into part, cnt using u;
      snap := snap || jsonb_build_object(t, part);
      n := n + cnt;
    end loop;
    insert into public.backups (user_id, rows, data) values (u, n, snap);
    delete from public.backups b where b.user_id = u
      and b.id not in (select id from public.backups where user_id = u order by taken_at desc limit keep);
    users := users + 1;
  end loop;
  return users;
end $$;
revoke execute on function public.take_backups(int) from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'movement-nightly-backup';
select cron.schedule('movement-nightly-backup', '17 3 * * *', $$select public.take_backups(21)$$);
