alter table public.businesses
  add column if not exists service_types text,
  add column if not exists business_logo text;

create index if not exists businesses_owner_created_idx
on public.businesses(owner_id, created_at desc);

drop policy if exists "Owners can view own businesses" on public.businesses;
create policy "Owners can view own businesses"
on public.businesses
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Owners can create own businesses" on public.businesses;
create policy "Owners can create own businesses"
on public.businesses
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Owners can update own businesses" on public.businesses;
create policy "Owners can update own businesses"
on public.businesses
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());
