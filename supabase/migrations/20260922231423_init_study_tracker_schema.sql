-- Study tracker schema.
-- The 150-problem catalog itself lives in the app as static data (it never
-- changes and shouldn't cost a round trip). Only per-user state lives here.

-- ---------------------------------------------------------------- progress
create table public.problem_progress (
  user_id         uuid        not null references auth.users (id) on delete cascade,
  problem_id      text        not null,  -- leetcode slug; joins to the static catalog
  status          text        not null default 'todo',
  starred         boolean     not null default false,
  notes           text        not null default '',
  -- spaced repetition state
  solid_streak    smallint    not null default 0,  -- consecutive 'solid' ratings
  due_on          date,                            -- null = not scheduled for review
  last_rating     text,
  last_attempt_at timestamptz,
  solved_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint problem_progress_pkey primary key (user_id, problem_id),
  constraint problem_progress_status_check
    check (status in ('todo', 'solved')),
  constraint problem_progress_last_rating_check
    check (last_rating is null or last_rating in ('solid', 'shaky', 'struggled')),
  constraint problem_progress_problem_id_check
    check (char_length(problem_id) between 1 and 120),
  constraint problem_progress_notes_check
    check (char_length(notes) <= 10000),
  constraint problem_progress_solid_streak_check
    check (solid_streak >= 0)
);

-- ---------------------------------------------------------------- attempts
-- Append-only log. Streaks, the activity heatmap and per-topic confidence are
-- all derived from this rather than denormalized, so they can't drift.
create table public.attempts (
  id               bigint      generated always as identity primary key,
  user_id          uuid        not null references auth.users (id) on delete cascade,
  problem_id       text        not null,
  rating           text        not null,
  duration_seconds integer,
  attempted_at     timestamptz not null default now(),
  constraint attempts_rating_check
    check (rating in ('solid', 'shaky', 'struggled')),
  constraint attempts_problem_id_check
    check (char_length(problem_id) between 1 and 120),
  constraint attempts_duration_check
    check (duration_seconds is null or duration_seconds between 0 and 86400)
);

-- ---------------------------------------------------------------- settings
create table public.user_settings (
  user_id       uuid        primary key references auth.users (id) on delete cascade,
  active_list   text        not null default 'blind75',
  theme         text        not null default 'system',
  daily_goal    smallint    not null default 3,
  timer_minutes smallint    not null default 35,
  updated_at    timestamptz not null default now(),
  constraint user_settings_active_list_check
    check (active_list in ('blind75', 'neetcode150')),
  constraint user_settings_theme_check
    check (theme in ('system', 'light', 'dark')),
  constraint user_settings_daily_goal_check
    check (daily_goal between 1 and 50),
  constraint user_settings_timer_check
    check (timer_minutes between 5 and 180)
);

-- ----------------------------------------------------------------- indexes
-- problem_progress(user_id, ...) lookups ride the primary key.
create index attempts_user_attempted_idx
  on public.attempts (user_id, attempted_at desc);
create index attempts_user_problem_idx
  on public.attempts (user_id, problem_id);
-- Partial: the review queue only ever asks for rows that are scheduled.
create index problem_progress_due_idx
  on public.problem_progress (user_id, due_on)
  where due_on is not null;

-- ---------------------------------------------------------------- updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger problem_progress_set_updated_at
  before update on public.problem_progress
  for each row execute function public.set_updated_at();

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------- RLS
alter table public.problem_progress enable row level security;
alter table public.attempts         enable row level security;
alter table public.user_settings    enable row level security;

-- auth.uid() is wrapped in a select so it evaluates once per query, not per row.
-- Every update carries both using and with check, otherwise a row could be
-- reassigned to another user_id.

create policy problem_progress_select on public.problem_progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy problem_progress_insert on public.problem_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy problem_progress_update on public.problem_progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy problem_progress_delete on public.problem_progress
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy attempts_select on public.attempts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy attempts_insert on public.attempts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy attempts_update on public.attempts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy attempts_delete on public.attempts
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy user_settings_select on public.user_settings
  for select to authenticated using ((select auth.uid()) = user_id);
create policy user_settings_insert on public.user_settings
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy user_settings_update on public.user_settings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy user_settings_delete on public.user_settings
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ------------------------------------------------------------------ grants
-- Since 2026-04-28 new public tables are not exposed to the Data API
-- automatically; these grants are what make them reachable. anon gets nothing:
-- every row in this schema belongs to a signed-in user.
grant select, insert, update, delete on public.problem_progress to authenticated;
grant select, insert, update, delete on public.attempts         to authenticated;
grant select, insert, update, delete on public.user_settings    to authenticated;
