-- The project does not auto-expose new tables, which also means the
-- service role (used only by our edge functions) gets no privileges by
-- default. Grant it explicitly. Every future migration that creates a table
-- must add the same grant.
grant select, insert, update, delete on
  public.profiles,
  public.subscriptions,
  public.businesses,
  public.gbp_connections,
  public.review_sessions,
  public.private_feedback
to service_role;
