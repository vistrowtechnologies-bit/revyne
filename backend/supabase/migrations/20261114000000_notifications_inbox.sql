-- In-app notifications list: every alert RevYne sends is also saved here so
-- the owner can see past alerts (bell on Home). Written only by edge
-- functions; owners read, mark read and delete their own. Rows (which can
-- quote Google review text) are deleted after 30 days, per the GBP API policy.

create table public.notifications (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('review', 'message', 'post', 'profile', 'system')),
  title      text not null,
  body       text not null default '',
  route      text not null default '/home',
  created_at timestamptz not null default now(),
  read_at    timestamptz
);

create index notifications_user_time on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications: owner reads own" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "notifications: owner marks read" on public.notifications
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "notifications: owner deletes own" on public.notifications
  for delete to authenticated using (user_id = (select auth.uid()));

grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant select, insert, update, delete on public.notifications to service_role;

-- Daily cleanup (03:15 IST = 21:45 UTC).
select cron.schedule(
  'notifications-30-day-cleanup',
  '45 21 * * *',
  $$ delete from public.notifications where created_at < now() - interval '30 days' $$
);
