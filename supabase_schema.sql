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

-- Enable Row Level Security on all tables
alter table profile          enable row level security;
alter table sessions         enable row level security;
alter table custom_exercises enable row level security;
alter table custom_goals     enable row level security;
alter table overrides        enable row level security;
alter table session_index    enable row level security;
alter table cache            enable row level security;

-- RLS Policies: users can only see and edit their own data
create policy "profile: own data"          on profile          for all using (auth.uid() = user_id);
create policy "sessions: own data"         on sessions         for all using (auth.uid() = user_id);
create policy "custom_exercises: own data" on custom_exercises for all using (auth.uid() = user_id);
create policy "custom_goals: own data"     on custom_goals     for all using (auth.uid() = user_id);
create policy "overrides: own data"        on overrides        for all using (auth.uid() = user_id);
create policy "session_index: own data"    on session_index    for all using (auth.uid() = user_id);
create policy "cache: own data"            on cache            for all using (auth.uid() = user_id);
