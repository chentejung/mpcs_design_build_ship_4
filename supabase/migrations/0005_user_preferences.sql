-- A complete row is the onboarding state. Both answers are required in one write.
create table public.user_preferences (
  user_id text primary key default (auth.jwt() ->> 'sub'),
  display_name text not null check (
    display_name = btrim(display_name) and char_length(display_name) between 1 and 50
    and display_name !~ '[[:cntrl:]]'
  ),
  favorite_genre_ids integer[] not null check (
    cardinality(favorite_genre_ids) between 1 and 19
    and array_ndims(favorite_genre_ids) = 1
    and array_position(favorite_genre_ids, null) is null
    and favorite_genre_ids <@ array[28,12,16,35,80,99,18,10751,14,36,27,10402,9648,10749,878,10770,53,10752,37]
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;
revoke all on public.user_preferences from anon, authenticated;
grant select, insert, update on public.user_preferences to authenticated;

create policy "own preferences: select" on public.user_preferences for select to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'));
create policy "own preferences: insert" on public.user_preferences for insert to authenticated
  with check (user_id = (select auth.jwt() ->> 'sub'));
create policy "own preferences: update" on public.user_preferences for update to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'))
  with check (user_id = (select auth.jwt() ->> 'sub'));

create function public.preserve_preference_identity() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.user_id is distinct from old.user_id or new.created_at is distinct from old.created_at then
    raise exception 'Preference ownership and creation time cannot change';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger preserve_preference_identity before update on public.user_preferences
  for each row execute function public.preserve_preference_identity();
