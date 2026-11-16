-- Saved reply snippets the owner can drop into a review reply. {name} and
-- {business} are filled in by the app. Owners fully manage their own.
create table public.reply_templates (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 60),
  body        text not null check (char_length(body) between 1 and 1500),
  created_at  timestamptz not null default now()
);

create index reply_templates_business on public.reply_templates (business_id, created_at);

alter table public.reply_templates enable row level security;

create policy "reply_templates: owner manages own" on public.reply_templates
  for all to authenticated
  using (exists (select 1 from public.businesses b where b.id = reply_templates.business_id and b.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.businesses b where b.id = reply_templates.business_id and b.owner_id = (select auth.uid())));

grant select, insert, update, delete on public.reply_templates to authenticated;
grant select, insert, update, delete on public.reply_templates to service_role;
