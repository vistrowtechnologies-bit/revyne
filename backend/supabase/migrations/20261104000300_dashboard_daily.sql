-- Add a 7-day series (India time) to the Home dashboard numbers.
-- Still SECURITY INVOKER, so RLS keeps each owner to their own business.
create or replace function public.get_dashboard_stats(p_business_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with s as (
    select * from public.review_sessions where business_id = p_business_id
  ),
  days as (
    select generate_series(
      (now() at time zone 'Asia/Kolkata')::date - 6,
      (now() at time zone 'Asia/Kolkata')::date,
      interval '1 day'
    )::date as day
  )
  select jsonb_build_object(
    'visits_7d',      (select count(*) from s where created_at >= now() - interval '7 days'),
    'visits_prev_7d', (select count(*) from s where created_at >= now() - interval '14 days' and created_at < now() - interval '7 days'),
    'google_7d',      (select count(*) from s where opened_google_at >= now() - interval '7 days'),
    'google_prev_7d', (select count(*) from s where opened_google_at >= now() - interval '14 days' and opened_google_at < now() - interval '7 days'),
    'avg_rating_30d', (select round(avg(rating), 1) from s where created_at >= now() - interval '30 days'),
    'rated_30d',      (select count(rating) from s where created_at >= now() - interval '30 days'),
    'visits_total',   (select count(*) from s),
    'google_total',   (select count(opened_google_at) from s),
    'unread_feedback', (
      select count(*) from public.private_feedback f
      where f.business_id = p_business_id and f.read_at is null
    ),
    'daily_7d', (
      select jsonb_agg(jsonb_build_object(
        'day', d.day,
        'visits', (select count(*) from s where (s.created_at at time zone 'Asia/Kolkata')::date = d.day),
        'google', (select count(*) from s where (s.opened_google_at at time zone 'Asia/Kolkata')::date = d.day)
      ) order by d.day)
      from days d
    )
  );
$$;
