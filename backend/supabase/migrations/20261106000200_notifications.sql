-- Push notifications (Firebase Cloud Messaging).
--  • device_tokens: each signed-in phone's FCM token; owners manage their own.
--  • businesses.review_watch_at: newest Google review time already alerted on
--    (a timestamp only — no review content is stored).
--  • gbp-review-watch runs every 10 minutes (same vault secret as the scheduler).

create table public.device_tokens (
  token      text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  platform   text not null default 'android' check (platform in ('android', 'ios', 'web')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index device_tokens_user on public.device_tokens (user_id);

alter table public.device_tokens enable row level security;

create policy "own device tokens" on public.device_tokens
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.device_tokens to authenticated;
grant select, insert, update, delete on public.device_tokens to service_role;

alter table public.businesses add column review_watch_at timestamptz;

select cron.schedule(
  'gbp-review-watch',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://qokgcupkabyzdqmgtgdp.supabase.co/functions/v1/gbp-review-watch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-scheduler-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'scheduler_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  )
  $$
);
