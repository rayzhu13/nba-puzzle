# Hoopdle 🏀

A weekly-rotating NBA guessing game, inspired by Wordle/Immaculate Grid-style
puzzles. Built end-to-end — schema, auth, admin authoring tools, scoring
logic, and public game UI — with Next.js, TypeScript, and Supabase.

**Stack:** Next.js 16 (App Router) · TypeScript · Supabase (Postgres, Auth,
RLS) · Tailwind CSS · Vercel Cron

---

## Overview

Hoopdle publishes one new NBA puzzle per week. Admins author and schedule
puzzles ahead of time through a private dashboard; a cron job promotes the
next scheduled puzzle to "live" automatically, so the site runs unattended
between authoring sessions.

There are two puzzle families:

- **Lineup puzzles** (`lineup_history`, `lineup_2k`, `lineup_gif`) — five clue
  cards (PG/SG/SF/PF/C), each hinting at the same mystery team, resolved by a
  single guess.
- **Grid puzzles** (`grid_category`, `grid_bpm`) — an Immaculate-Grid-style
  board of team logos, each slot needing its own player guess, with strikes
  shared across the whole board.

Scoring runs on a shared 5-star system that steps down as strikes accumulate,
and both puzzle families reuse the same guess/reveal/practice-mode game
engine (`useGameState`).

## Features

- **Two puzzle formats, one scoring engine** — lineup and grid puzzles share
  strike tracking, star scoring, and a "keep trying" practice mode that
  unlocks after a loss without affecting the score.
- **Admin dashboard** — magic-link authentication (Supabase Auth,
  `signInWithOtp`), a puzzle builder with searchable team/player autocomplete,
  and scheduled publishing via `go_live_at`.
- **Automated weekly rotation** — a Vercel Cron job (`vercel.json`) hits
  `/api/cron/rotate-puzzle` every Monday to archive the live puzzle and
  promote the next scheduled one, authenticated with a bearer `CRON_SECRET`.
- **Answers never ship to the client** — puzzle slots are stripped of
  `answer_id` before being sent to the public page; guesses are verified
  server-side against Supabase with row-level security policies.
- **Searchable dropdowns with fuzzy matching** — Postgres `pg_trgm` powers
  fast team/player search for both the public guess input and the admin
  puzzle form.

## Architecture

```
Browser ──▶ Next.js App Router (React 19 client components)
              │
              ├─ Public game: /app/page.tsx, GridBoard, LineupBoard
              │     └─ useGameState() → /api/guess, /api/reveal
              │
              ├─ Admin dashboard: /app/admin/*  (magic-link gated)
              │     └─ PuzzleForm, PlayersManager → /api/puzzles, /api/players
              │
              └─ Cron: /api/cron/rotate-puzzle  (Bearer CRON_SECRET, Vercel Cron)
                    │
                    ▼
              Supabase (Postgres + Auth + RLS)
                teams · players · puzzles · puzzle_slots
```

Domain types and the star-scoring table live in `src/types/puzzle.ts` and are
shared, framework-agnostically, across the admin form, game boards, and API
routes.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase keys, see below
npm run dev
```

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run `supabase/schema.sql` — creates `teams`,
   `players`, `puzzles`, `puzzle_slots`, enums, and RLS policies.
3. Seed `teams` and `players` with real NBA data (`supabase/seed_teams.sql`,
   `supabase/seed_players.sql`, or `scripts/seed-players-from-api.mjs`) —
   the search dropdowns and admin form depend on this reference data.
4. Project Settings → API: copy the URL, anon key, and service role key into
   `.env.local` (and later into Vercel's env vars).
5. Authentication → Providers: enable Email (magic link) — the admin login
   uses `signInWithOtp`.
6. Set `ADMIN_EMAILS` to your own email so `/admin` will let you in.

### Environment variables

| Variable                        | Description                                            |
| -------------------------------- | -------------------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`       | Supabase project URL                                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Supabase anon/public key                                |
| `SUPABASE_SERVICE_ROLE_KEY`      | Service role key (server-side only, never exposed)      |
| `ADMIN_EMAILS`                   | Comma-separated emails allowed into `/admin`             |
| `CRON_SECRET`                    | Bearer token Vercel Cron sends to `/api/cron/rotate-puzzle` |

## Using the admin dashboard

Go to `/admin` → sign in via the magic link sent to an address in
`ADMIN_EMAILS` → **New puzzle**. Pick a type, fill in the clues, pick answers
via the same searchable dropdown the public game uses, then **Save &
schedule** with a `go_live_at` date/time. The cron job promotes it
automatically once that time passes.

## Deploying

1. Push to GitHub and import the repo in [Vercel](https://vercel.com).
2. Add the same env vars from `.env.local.example` to Vercel's project
   settings (Production + Preview).
3. Deploy — Vercel Cron picks up the schedule in `vercel.json` automatically
   on Pro plans (Hobby allows at most 1 cron run/day at a fixed time, which
   still covers this weekly job).

## Project structure

```
src/
  app/
    page.tsx                 # public game entry
    admin/                   # magic-link-gated authoring dashboard
    api/
      guess/                 # server-verified answer checking
      reveal/                # give-up / reveal endpoint
      puzzles/, players/     # admin CRUD
      cron/rotate-puzzle/    # weekly promote/archive job
  components/
    LineupBoard.tsx, GridBoard.tsx   # the two puzzle-family boards
    SearchableDropdown.tsx           # shared fuzzy-search input
    admin/PuzzleForm.tsx             # puzzle authoring form
  lib/
    useGameState.ts          # shared strike/star/practice-mode logic
    supabase/                # client, server, and admin Supabase helpers
  types/puzzle.ts            # shared domain types + scoring table
supabase/
  schema.sql, seed_teams.sql, seed_players.sql
```

## Roadmap / intentionally out of scope

- Public user accounts / sign-in
- Shareable result graphic
- Leaderboards

Supabase Auth is already wired up for the admin side, so adding public
accounts later mostly means reusing that plumbing plus a `puzzle_results`
table — no rip-and-replace required.
