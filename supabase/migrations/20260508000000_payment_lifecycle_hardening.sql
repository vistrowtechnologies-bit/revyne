alter table public.payment_events
  add column if not exists processing_status text not null default 'received',
  add column if not exists processing_error text,
  add column if not exists profile_updated boolean not null default false;

alter table public.businesses
  add column if not exists owner_plan text not null default 'free',
  add column if not exists owner_plan_status text not null default 'free',
  add column if not exists owner_plan_current_end timestamptz;

drop policy if exists "Admins can view payment events" on public.payment_events;

create policy "Admins can view payment events"
on public.payment_events
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

grant select, insert, update on public.profiles to service_role;
grant select, insert, update on public.payment_events to service_role;
grant select, update on public.businesses to service_role;
