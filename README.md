# Hoopdle

A weekly-rotating NBA guessing game. Next.js (App Router) + TypeScript + Supabase (Postgres + Auth) + Vercel Cron.

## Puzzle families

- **Lineup puzzles** (`lineup_history`, `lineup_2k`, `lineup_gif`) — one team is the
  answer; the board shows 5 clue cards (PG/SG/SF/PF/C) that each hint at that
  team, and the player makes one guess for the whole board.
- **Grid puzzles** (`grid_category`, `grid_bpm`) — a grid of team logos, each
  needing its own player guess (Immaculate-Grid style). Strikes are shared
  across the whole board.

> Assumption worth double-checking against your original idea: in the
> reference screenshot, all 5 lineup clue cards point at **one** team answer,
> not five separate answers. If you actually want each position to be its own
> guess, that's a schema change (each slot gets its own `answer_id`) — happy
> to make that swap if so.

## Local setup

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase keys, see below
npm run dev
```

## Supabase setup

1. Create a project at supabase.com.
2. Open the SQL editor and run `supabase/schema.sql` — creates `teams`,
   `players`, `puzzles`, `puzzle_slots`, enums, and RLS policies.
3. Seed `teams` and `players` with real NBA data (name, abbreviation,
   logo_url / headshot_url). This is reference data the search dropdowns and
   admin form depend on — populate it before building your first puzzle.
4. Project Settings -> API: copy the URL, anon key, and service role key into
   `.env.local` (and later into Vercel's env vars).
5. Authentication -> Providers: make sure Email (magic link) is enabled — the
   admin login uses `signInWithOtp`.
6. Set `ADMIN_EMAILS` to your own email so `/admin` will let you in.

## Admin dashboard

Go to `/admin` -> sign in with the magic link sent to an address in
`ADMIN_EMAILS` -> **New puzzle**. Pick a type, fill in the clues, pick answers
via the same searchable dropdown the public game uses, then **Save & schedule**
with a `go_live_at` date/time. The cron job promotes it automatically when
that time passes.

## Weekly rotation (Vercel Cron)

`vercel.json` schedules `/api/cron/rotate-puzzle` for Monday 12:00 UTC. On
each run it archives whatever puzzle is currently `live` and promotes the
earliest `scheduled` puzzle whose `go_live_at` has passed. It does **not**
generate content — you're pre-authoring puzzles ~2 weeks ahead as planned, so
this route is just "flip the switch," matching what you described.

Add `CRON_SECRET` in Vercel's env vars — Vercel sends it automatically as a
Bearer token to routes referenced in `vercel.json`.

## Deploying

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add the same env vars from `.env.local.example` in Vercel's project
   settings (Production + Preview).
4. Deploy. Vercel Cron picks up `vercel.json` automatically on Pro plans (the
   Hobby plan allows at most 1 cron run/day at a fixed time, which is fine
   for a weekly job — just double check your plan's cron limits).

## What's intentionally not built yet (per our scope discussion)

- Public user accounts / sign-in
- Shareable result graphic
- Leaderboards

Supabase Auth is already wired up for the admin side, so adding real accounts
later mostly means reusing that plumbing on the public pages plus a
`puzzle_results` table — it won't require ripping anything out.
