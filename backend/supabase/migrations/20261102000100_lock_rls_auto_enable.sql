-- `rls_auto_enable()` is the event-trigger function Supabase created for the
-- project's "automatic RLS" setting. Event triggers don't need EXECUTE grants
-- to fire, so API roles never need to call it directly.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Note: the Security Advisor also flags get_review_page(text). That is
-- intentional — it is the only public entry point for the customer review page
-- and returns public fields for a single unguessable slug.
