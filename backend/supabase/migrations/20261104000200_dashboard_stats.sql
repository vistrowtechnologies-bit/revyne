-- Home dashboard numbers in one round trip.
-- SECURITY INVOKER: runs with the caller's rights, so the existing RLS on
-- review_sessions / private_feedback limits it to the owner's own business.
create function public.get_dashboard_stats(p_business_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'visits_7d',      count(*) filter (where s.created_at >= now() - interval '7 days'),
    'visits_prev_7d', count(*) filter (where s.created_at >= now() - interval '14 days' and s.created_at < now() - interval '7 days'),
    'google_7d',      count(*) filter (where s.opened_google_at >= now() - interval '7 days'),
    'google_prev_7d', count(*) filter (where s.opened_google_at >= now() - interval '14 days' and s.opened_google_at < now() - interval '7 days'),
    'avg_rating_30d', round(avg(s.rating) filter (where s.created_at >= now() - interval '30 days'), 1),
    'rated_30d',      count(s.rating) filter (where s.created_at >= now() - interval '30 days'),
    'visits_total',   count(*),
    'google_total',   count(s.opened_google_at),
    'unread_feedback', (
      select count(*) from public.private_feedback f
      where f.business_id = p_business_id and f.read_at is null
    )
  )
  from public.review_sessions s
  where s.business_id = p_business_id;
$$;

revoke execute on function public.get_dashboard_stats(uuid) from public, anon;
grant execute on function public.get_dashboard_stats(uuid) to authenticated;
