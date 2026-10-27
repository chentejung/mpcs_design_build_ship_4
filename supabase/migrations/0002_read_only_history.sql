-- History is read-only, enforced by the database (AGENTS.md → Read-only History trigger). Every write made as the
-- authenticated role (every app user) is checked; database-owner SQL (migrations, seeding test History) is not.
-- A write is allowed only when:
--   * the row's month is a current month somewhere on Earth (UTC−12…UTC+14), for the new row on insert/update and the
--     old row on update/delete, so nobody writes to an older month but a user at 11 pm on the 31st isn't locked out;
--   * an update changes nothing but watched_at;
--   * watched_at, when set, is not later than a minute from now.

create function public.movie_list_entries_read_only_history()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  earliest date := date_trunc('month', now() - interval '14 hours')::date;
  latest   date := date_trunc('month', now() + interval '14 hours')::date;
begin
  if current_user <> 'authenticated' then
    return coalesce(new, old);
  end if;

  if tg_op in ('INSERT', 'UPDATE') and new.month not between earliest and latest then
    raise exception 'History is read-only: % is not this month', new.month using errcode = '42501';
  end if;
  if tg_op in ('UPDATE', 'DELETE') and old.month not between earliest and latest then
    raise exception 'History is read-only: % is not this month', old.month using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and (
    new.id, new.user_id, new.month, new.tmdb_id, new.title, new.original_title, new.original_language,
    new.release_year, new.runtime, new.poster_path, new.genre_ids, new.overview, new.added_at
  ) is distinct from (
    old.id, old.user_id, old.month, old.tmdb_id, old.title, old.original_title, old.original_language,
    old.release_year, old.runtime, old.poster_path, old.genre_ids, old.overview, old.added_at
  ) then
    raise exception 'Only watched_at can change on an Entry' using errcode = '42501';
  end if;

  if tg_op in ('INSERT', 'UPDATE') and new.watched_at > now() + interval '1 minute' then
    raise exception 'watched_at can''t be in the future' using errcode = '22007';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger read_only_history
  before insert or update or delete on public.movie_list_entries
  for each row execute function public.movie_list_entries_read_only_history();
