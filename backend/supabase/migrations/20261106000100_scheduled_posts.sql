-- Scheduled Google posts. Google's API can't schedule, so RevYne stores the
-- post and a cron job calls the gbp-scheduler function every 5 minutes to
-- publish whatever is due.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create table public.scheduled_posts (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  post         jsonb not null,          -- the owner's form (see _shared/post_edit.ts PostInput)
  media_path   text,                    -- photo in the private gbp-media bucket
  publish_at   timestamptz not null,
  status       text not null default 'pending'
               check (status in ('pending', 'publishing', 'published', 'failed', 'cancelled')),
  error        text,
  google_name  text,                    -- accounts/…/localPosts/… once published
  created_at   timestamptz not null default now(),
  published_at timestamptz
);

create index scheduled_posts_due on public.scheduled_posts (publish_at) where status = 'pending';
create index scheduled_posts_business on public.scheduled_posts (business_id, publish_at desc);

alter table public.scheduled_posts enable row level security;

-- Owners read their own; all writes go through edge functions (validation).
create policy "owners read own scheduled posts" on public.scheduled_posts
  for select to authenticated
  using (business_id in (select id from public.businesses where owner_id = auth.uid()));

grant select on public.scheduled_posts to authenticated;
grant select, insert, update, delete on public.scheduled_posts to service_role;

-- Shared secret for the cron → function call. Generated here, at run time, so
-- it never appears in git or anyone's clipboard; only the cron job and the
-- scheduler_secret_ok() check (service role only) can read it.
select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'scheduler_secret',
  'Shared secret for the gbp-scheduler cron call');

create function public.scheduler_secret_ok(p text) returns boolean
  language sql security definer set search_path = '' stable
as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'scheduler_secret' and decrypted_secret = p)
$$;

revoke execute on function public.scheduler_secret_ok(text) from public, anon, authenticated;
grant execute on function public.scheduler_secret_ok(text) to service_role;

-- Every 5 minutes. The URL is this project's (revyne-dev); a production project
-- needs its own copy of this job.
select cron.schedule(
  'gbp-publish-scheduled',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://qokgcupkabyzdqmgtgdp.supabase.co/functions/v1/gbp-scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-scheduler-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'scheduler_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  )
  $$
);

-- The log also records scheduling.
alter table public.owner_actions drop constraint owner_actions_kind_check;
alter table public.owner_actions add constraint owner_actions_kind_check
  check (kind in ('reply_draft', 'reply_posted', 'reply_deleted', 'profile_edit', 'description_draft',
                  'post_draft', 'post_created', 'post_deleted', 'photo_added', 'photo_deleted',
                  'post_scheduled', 'post_schedule_cancelled'));
