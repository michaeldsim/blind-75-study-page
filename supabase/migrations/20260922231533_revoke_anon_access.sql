-- Every row in these tables belongs to a signed-in user, so the anonymous role
-- has no legitimate reason to reach them. RLS already returns zero rows to
-- anon (no policy targets it), but revoking makes that explicit rather than
-- leaving it as an emergent property of the policy set.
revoke all on public.problem_progress from anon;
revoke all on public.attempts         from anon;
revoke all on public.user_settings    from anon;
