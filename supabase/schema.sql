-- ============================================================
-- Weekly NBA Puzzle — Supabase schema
-- Run this in the Supabase SQL editor (or via `supabase db push`)
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- enums ----------
create type puzzle_type as enum (
  'lineup_history',   -- guess the team from starting lineup's past teams
  'lineup_2k',        -- guess the team from starting lineup's 2K ratings
  'lineup_gif',       -- guess the team from starting lineup's player GIFs
  'grid_category',    -- guess players for a stat category, one per NBA team
  'grid_bpm'          -- guess players with highest box plus/minus
);

create type puzzle_status as enum ('draft', 'scheduled', 'live', 'archived');
create type answer_kind as enum ('team', 'player');

-- ---------- reference tables ----------
create table teams (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,                 -- "Dallas Mavericks"
  abbreviation  text not null unique,           -- "DAL"
  logo_url      text not null,
  search_name   text generated always as (lower(name || ' ' || abbreviation)) stored
);

create table players (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,                 -- "Luka Doncic"
  team_id       uuid references teams(id) on delete set null,
  headshot_url  text,
  search_name   text generated always as (lower(name)) stored
);

create extension if not exists pg_trgm;
create index players_search_idx on players using gin (search_name gin_trgm_ops);

-- ---------- puzzles ----------
create table puzzles (
  id              uuid primary key default gen_random_uuid(),
  type            puzzle_type not null,
  title           text not null,               -- "Guess the Team: Career Path Lineup"
  category_label  text,                        -- e.g. "Highest PPG This Season" (grid types)
  status          puzzle_status not null default 'draft',
  week_number     int,                          -- e.g. 14 -> "Puzzle #014"
  go_live_at      timestamptz,
  max_strikes     int not null default 5 check (max_strikes in (3, 5)),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Only one puzzle should be 'live' at a time. Enforced in application logic
-- (the cron route), not a DB constraint, to keep manual overrides easy.

create table puzzle_slots (
  id           uuid primary key default gen_random_uuid(),
  puzzle_id    uuid not null references puzzles(id) on delete cascade,
  slot_index   int not null,                   -- display order, 0-based
  clue_data    jsonb not null default '{}',    -- shape depends on puzzle.type, see README
  answer_kind  answer_kind not null,
  answer_id    uuid not null,                  -- references teams.id or players.id depending on answer_kind
  unique (puzzle_id, slot_index)
);

create index puzzle_slots_puzzle_idx on puzzle_slots(puzzle_id);

create extension if not exists moddatetime;

create trigger set_updated_at
before update on puzzles
for each row execute procedure moddatetime(updated_at);

-- ---------- row level security ----------
alter table teams enable row level security;
alter table players enable row level security;
alter table puzzles enable row level security;
alter table puzzle_slots enable row level security;

-- Public (anon) can read teams/players (needed for search dropdown)
-- and can read puzzles/slots ONLY when status = 'live'.
create policy "teams are public read" on teams for select using (true);
create policy "players are public read" on players for select using (true);

create policy "live puzzles are public read" on puzzles
  for select using (status = 'live');

create policy "slots of live puzzles are public read" on puzzle_slots
  for select using (
    exists (select 1 from puzzles p where p.id = puzzle_slots.puzzle_id and p.status = 'live')
  );

-- Admin/service-role bypasses RLS automatically (uses the service key server-side),
-- so no additional write policies are needed for the admin dashboard or cron job.
