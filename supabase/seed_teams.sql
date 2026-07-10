-- Seed: all 30 NBA teams
-- Run this in the Supabase SQL editor, after schema.sql has already run.
-- Logos point at ESPN's public team-logo CDN (a common stable source);
-- if any logo looks wrong or broken once you view it, swap that one
-- row's logo_url for another source without needing to touch anything else.

insert into teams (name, abbreviation, logo_url) values
  ('Atlanta Hawks', 'ATL', 'https://a.espncdn.com/i/teamlogos/nba/500/atl.png'),
  ('Boston Celtics', 'BOS', 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png'),
  ('Brooklyn Nets', 'BKN', 'https://a.espncdn.com/i/teamlogos/nba/500/bkn.png'),
  ('Charlotte Hornets', 'CHA', 'https://a.espncdn.com/i/teamlogos/nba/500/cha.png'),
  ('Chicago Bulls', 'CHI', 'https://a.espncdn.com/i/teamlogos/nba/500/chi.png'),
  ('Cleveland Cavaliers', 'CLE', 'https://a.espncdn.com/i/teamlogos/nba/500/cle.png'),
  ('Dallas Mavericks', 'DAL', 'https://a.espncdn.com/i/teamlogos/nba/500/dal.png'),
  ('Denver Nuggets', 'DEN', 'https://a.espncdn.com/i/teamlogos/nba/500/den.png'),
  ('Detroit Pistons', 'DET', 'https://a.espncdn.com/i/teamlogos/nba/500/det.png'),
  ('Golden State Warriors', 'GSW', 'https://a.espncdn.com/i/teamlogos/nba/500/gs.png'),
  ('Houston Rockets', 'HOU', 'https://a.espncdn.com/i/teamlogos/nba/500/hou.png'),
  ('Indiana Pacers', 'IND', 'https://a.espncdn.com/i/teamlogos/nba/500/ind.png'),
  ('LA Clippers', 'LAC', 'https://a.espncdn.com/i/teamlogos/nba/500/lac.png'),
  ('Los Angeles Lakers', 'LAL', 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png'),
  ('Memphis Grizzlies', 'MEM', 'https://a.espncdn.com/i/teamlogos/nba/500/mem.png'),
  ('Miami Heat', 'MIA', 'https://a.espncdn.com/i/teamlogos/nba/500/mia.png'),
  ('Milwaukee Bucks', 'MIL', 'https://a.espncdn.com/i/teamlogos/nba/500/mil.png'),
  ('Minnesota Timberwolves', 'MIN', 'https://a.espncdn.com/i/teamlogos/nba/500/min.png'),
  ('New Orleans Pelicans', 'NOP', 'https://a.espncdn.com/i/teamlogos/nba/500/no.png'),
  ('New York Knicks', 'NYK', 'https://a.espncdn.com/i/teamlogos/nba/500/ny.png'),
  ('Oklahoma City Thunder', 'OKC', 'https://a.espncdn.com/i/teamlogos/nba/500/okc.png'),
  ('Orlando Magic', 'ORL', 'https://a.espncdn.com/i/teamlogos/nba/500/orl.png'),
  ('Philadelphia 76ers', 'PHI', 'https://a.espncdn.com/i/teamlogos/nba/500/phi.png'),
  ('Phoenix Suns', 'PHX', 'https://a.espncdn.com/i/teamlogos/nba/500/phx.png'),
  ('Portland Trail Blazers', 'POR', 'https://a.espncdn.com/i/teamlogos/nba/500/por.png'),
  ('Sacramento Kings', 'SAC', 'https://a.espncdn.com/i/teamlogos/nba/500/sac.png'),
  ('San Antonio Spurs', 'SAS', 'https://a.espncdn.com/i/teamlogos/nba/500/sa.png'),
  ('Toronto Raptors', 'TOR', 'https://a.espncdn.com/i/teamlogos/nba/500/tor.png'),
  ('Utah Jazz', 'UTA', 'https://a.espncdn.com/i/teamlogos/nba/500/utah.png'),
  ('Washington Wizards', 'WAS', 'https://a.espncdn.com/i/teamlogos/nba/500/wsh.png');
