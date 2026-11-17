-- Adds an optional season label to puzzles, shown on the board as
-- "Week 12 · 2025–26 Season". Run once in the Supabase SQL editor.
alter table puzzles add column if not exists season text;
