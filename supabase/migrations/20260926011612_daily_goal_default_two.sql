-- The daily plan is one new problem plus reviews; two is a realistic day at
-- ~30 minutes a problem.
alter table public.user_settings alter column daily_goal set default 2;
