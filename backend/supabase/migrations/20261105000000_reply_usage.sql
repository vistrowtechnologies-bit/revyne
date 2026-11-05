-- Counts owner actions that cost money or touch Google, for server-side limits
-- (AI reply drafts) and an audit trail (replies posted / deleted). Holds no
-- review text, so no Google content is stored here.
create table public.owner_actions (
  id          bigint generated always as identity primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  kind        text not null check (kind in ('reply_draft', 'reply_posted', 'reply_deleted')),
  review_id   text,
  created_at  timestamptz not null default now()
);

create index owner_actions_business_kind_time on public.owner_actions (business_id, kind, created_at desc);

alter table public.owner_actions enable row level security;
-- No client policies or grants: only edge functions (service role) use it.
grant select, insert on public.owner_actions to service_role;
