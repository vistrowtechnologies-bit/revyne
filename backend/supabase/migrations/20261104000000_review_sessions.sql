-- ─────────────────────────────────────────────────────────────────────────────
-- Customer review page data.
--
--   review_sessions   one per customer visit to /r/<slug>: rating, what they
--                     liked, their own words, the AI draft, whether they copied
--                     it / opened Google. Written only by the review-page edge
--                     function (service role); owners read their own.
--   private_feedback  messages customers chose to send privately. Offered to
--                     EVERY customer regardless of rating (no review gating).
--
-- Anonymous customers never touch these tables directly.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.review_sessions (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references public.businesses (id) on delete cascade,
  rating           smallint check (rating between 1 and 5),
  highlights       text[] not null default '{}' check (cardinality(highlights) <= 12),
  customer_words   text check (char_length(customer_words) <= 500),
  language         text,
  draft            text check (char_length(draft) <= 2000),
  drafts_generated smallint not null default 0,
  copied_at        timestamptz,
  opened_google_at timestamptz,
  visitor_hash     text,  -- sha256(ip + business + day): rate limiting without storing IPs
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index review_sessions_business_created_idx on public.review_sessions (business_id, created_at desc);
create index review_sessions_visitor_idx on public.review_sessions (visitor_hash, created_at desc);

alter table public.review_sessions enable row level security;

create trigger review_sessions_set_updated_at
  before update on public.review_sessions
  for each row execute function public.set_updated_at();

create policy "review_sessions: owner reads own business"
  on public.review_sessions for select to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = review_sessions.business_id and b.owner_id = (select auth.uid())
  ));

grant select on public.review_sessions to authenticated;

create table public.private_feedback (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  session_id   uuid references public.review_sessions (id) on delete set null,
  rating       smallint check (rating between 1 and 5),
  message      text not null check (char_length(message) between 1 and 1000),
  contact_name text check (char_length(contact_name) <= 80),
  contact      text check (char_length(contact) <= 120),  -- phone or email, optional
  visitor_hash text,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index private_feedback_business_created_idx on public.private_feedback (business_id, created_at desc);

alter table public.private_feedback enable row level security;

create policy "private_feedback: owner reads own business"
  on public.private_feedback for select to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = private_feedback.business_id and b.owner_id = (select auth.uid())
  ));

create policy "private_feedback: owner marks read"
  on public.private_feedback for update to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = private_feedback.business_id and b.owner_id = (select auth.uid())
  ));

grant select on public.private_feedback to authenticated;
grant update (read_at) on public.private_feedback to authenticated;

-- The public page also needs the owner's products for the "what did you like" chips.
drop function public.get_review_page(text);

create function public.get_review_page(p_slug text)
returns table (
  name              text,
  category          text,
  city              text,
  google_review_url text,
  review_languages  text[],
  products          text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select b.name, b.category, b.city, b.google_review_url, b.review_languages, b.products
  from public.businesses b
  where b.public_slug = p_slug;
$$;

revoke execute on function public.get_review_page(text) from public;
grant execute on function public.get_review_page(text) to anon, authenticated;
