create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  business_id uuid references public.businesses(id) on delete set null,
  session_id text not null,
  event_name text not null,
  page_view boolean not null default false,
  path text,
  view_name text,
  referrer text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.analytics_events enable row level security;

create policy "Clients can create analytics events"
on public.analytics_events
for insert
to anon, authenticated
with check (
  user_id is null
  or auth.uid() = user_id
);

create policy "Users can view own analytics events"
on public.analytics_events
for select
to authenticated
using (
  auth.uid() = user_id
);

create policy "Admins can view analytics events"
on public.analytics_events
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at desc);
create index if not exists analytics_events_event_name_idx on public.analytics_events(event_name);
create index if not exists analytics_events_user_id_idx on public.analytics_events(user_id);
create index if not exists analytics_events_session_id_idx on public.analytics_events(session_id);
create index if not exists analytics_events_page_view_idx on public.analytics_events(page_view);
