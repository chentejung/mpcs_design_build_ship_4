-- Test History for Playwright users A and B: one past month each, September 2026 (AGENTS.md → Testing).
--
-- Runs as the DATABASE OWNER through the Supabase MCP's `execute_sql`, which the read-only History trigger doesn't
-- check. Never from the app, never as `authenticated`: the trigger would (rightly) refuse it. Tests treat these rows
-- as read-only. Safe to rerun: each row is put back exactly as below (same id, since an existing row is updated in
-- place), and any other past-month Entry of A or B is deleted.
--
-- User ids come from Clerk's Backend API by the test users' emails (TEST_USER_A_EMAIL / TEST_USER_B_EMAIL in
-- .env.test.local); recreating a user in Clerk gives it a new id, and this file then needs the new one.
-- Snapshots are what TMDB's GET /3/movie/{id} answered on 2026-10-27.
--
--   A  user_3LGBtBfGJq5kYprWw2maZZcPbC7  5 planned · 2 watched (The Matrix, Spirited Away)
--   B  user_3LGBtDWY1uKgLkKO1hnuPporg9P  4 planned · 2 watched (Fight Club, Buddy)
--
-- Clayface (A, Not watched yet) and Buddy (B, Watched) are in the Now Playing fixture, so Browse shows their
-- "In your Sep 2026 list" note and History's Add it to this month can meet Already saved.

begin;

create temporary table seed (like public.movie_list_entries including defaults) on commit drop;

insert into seed (user_id, month, tmdb_id, title, original_title, original_language, release_year, runtime, poster_path,
                  genre_ids, overview, added_at, watched_at)
values
  ('user_3LGBtBfGJq5kYprWw2maZZcPbC7', '2026-09-01', 603, 'The Matrix', 'The Matrix', 'en', 1999, 136,
   '/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg', '{28,878}',
   'Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth.',
   '2026-09-03 18:00:00+00', '2026-09-12 21:00:00+00'),
  ('user_3LGBtBfGJq5kYprWw2maZZcPbC7', '2026-09-01', 680, 'Pulp Fiction', 'Pulp Fiction', 'en', 1994, 154,
   '/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg', '{53,80,35}',
   'A burger-loving hit man, his philosophical partner, a drug-addled gangster''s moll and a washed-up boxer converge in this sprawling, comedic crime caper. Their adventures unfurl in three stories that ingeniously trip back and forth in time.',
   '2026-09-05 18:00:00+00', null),
  ('user_3LGBtBfGJq5kYprWw2maZZcPbC7', '2026-09-01', 238, 'The Godfather', 'The Godfather', 'en', 1972, 175,
   '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', '{18,80}',
   'Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family. When organized crime family patriarch, Vito Corleone barely survives an attempt on his life, his youngest son, Michael steps in to take care of the would-be killers, launching a campaign of bloody revenge.',
   '2026-09-10 18:00:00+00', null),
  ('user_3LGBtBfGJq5kYprWw2maZZcPbC7', '2026-09-01', 129, 'Spirited Away', '千と千尋の神隠し', 'ja', 2001, 125,
   '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', '{16,10751,14}',
   'A young girl, Chihiro, becomes trapped in a strange new world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage she never knew she had to free her family.',
   '2026-09-14 18:00:00+00', '2026-09-21 20:00:00+00'),
  ('user_3LGBtBfGJq5kYprWw2maZZcPbC7', '2026-09-01', 1400940, 'Clayface', 'Clayface', 'en', 2026, 109,
   '/9l1NuFjel2j89hiuiJbsxfblqjy.jpg', '{27,53,878}',
   'Matt Hagen''s meteoric rise from Gotham street kid to Hollywood leading man is tragically cut short when a local crime boss''s actions leave him horribly disfigured. Abandoned by his team and with nothing left, Matt seeks out a cutting edge treatment that miraculously returns him to his former self… but also unexpectedly affects his grip on reality, spiraling him down a destructive path of all-consuming revenge.',
   '2026-09-24 18:00:00+00', null),

  ('user_3LGBtDWY1uKgLkKO1hnuPporg9P', '2026-09-01', 550, 'Fight Club', 'Fight Club', 'en', 1999, 139,
   '/jSziioSwPVrOy9Yow3XhWIBDjq1.jpg', '{18,53}',
   'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion.',
   '2026-09-04 18:00:00+00', '2026-09-20 21:00:00+00'),
  ('user_3LGBtDWY1uKgLkKO1hnuPporg9P', '2026-09-01', 13, 'Forrest Gump', 'Forrest Gump', 'en', 1994, 142,
   '/saHP97rTPS5eLmrLQEcANmKrsFl.jpg', '{35,18,10749}',
   'A man with a low IQ has accomplished great things in his life and been present during significant historic events—in each case, far exceeding what anyone imagined he could do. But despite all he has achieved, his one true love eludes him.',
   '2026-09-06 18:00:00+00', null),
  ('user_3LGBtDWY1uKgLkKO1hnuPporg9P', '2026-09-01', 155, 'The Dark Knight', 'The Dark Knight', 'en', 2008, 152,
   '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', '{28,53,80}',
   'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets. The partnership proves to be effective, but they soon find themselves prey to a reign of chaos unleashed by a rising criminal mastermind known to the terrified citizens of Gotham as the Joker.',
   '2026-09-11 18:00:00+00', null),
  ('user_3LGBtDWY1uKgLkKO1hnuPporg9P', '2026-09-01', 1514026, 'Buddy', 'Buddy', 'en', 2026, 96,
   '/1BdZbNvl1SfrrX8J9X5tQzN6Ivu.jpg', '{27,35,14}',
   'A magical, singing orange unicorn holds his cast hostage in a surreal TV-show dimension, as he becomes more and more demented.',
   '2026-09-16 18:00:00+00', '2026-09-26 20:00:00+00');

-- Any other past-month Entry of A or B goes.
delete from public.movie_list_entries e
where e.user_id in ('user_3LGBtBfGJq5kYprWw2maZZcPbC7', 'user_3LGBtDWY1uKgLkKO1hnuPporg9P')
  and e.month < '2026-10-01'
  and not exists (select 1 from seed s where (s.user_id, s.month, s.tmdb_id) = (e.user_id, e.month, e.tmdb_id));

-- Each seeded Entry, as above; an existing row keeps its id.
insert into public.movie_list_entries (user_id, month, tmdb_id, title, original_title, original_language, release_year,
                                       runtime, poster_path, genre_ids, overview, added_at, watched_at)
select user_id, month, tmdb_id, title, original_title, original_language, release_year, runtime, poster_path, genre_ids,
       overview, added_at, watched_at
from seed
on conflict (user_id, month, tmdb_id) do update set
  title = excluded.title, original_title = excluded.original_title, original_language = excluded.original_language,
  release_year = excluded.release_year, runtime = excluded.runtime, poster_path = excluded.poster_path,
  genre_ids = excluded.genre_ids, overview = excluded.overview, added_at = excluded.added_at,
  watched_at = excluded.watched_at;

commit;
