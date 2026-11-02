-- ─────────────────────────────────────────────────────────────────────────────
-- Foundation: profiles, subscriptions, businesses, public review-page lookup.
--
-- Security model
--   * Every table has RLS. The project does NOT auto-expose new tables, so
--     clients only get the grants written below — nothing else.
--   * Billing lives in `subscriptions`, which clients can read but never write
--     (only the service role — webhooks / edge functions — can change it).
--   * Customers on the public review page never read `businesses` directly;
--     they call get_review_page(slug), which returns only public fields.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── helpers ──────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ── profiles ─────────────────────────────────────────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text,
  email        text,
  avatar_url   text,
  app_language text not null default 'en',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create policy "profiles: owner reads own"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles: owner updates own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

grant select on public.profiles to authenticated;
grant update (full_name, avatar_url, app_language) on public.profiles to authenticated;

-- ── subscriptions (billing — client read-only) ───────────────────────────────
create table public.subscriptions (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  plan               text not null default 'free',  -- plan ids finalised in Phase 2
  status             text not null default 'active'
                       check (status in ('active', 'pending', 'past_due', 'cancelled', 'expired')),
  current_period_end timestamptz,
  provider           text check (provider in ('google_play', 'razorpay')),
  provider_ref       text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create policy "subscriptions: owner reads own"
  on public.subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.subscriptions to authenticated;

-- ── new user bootstrap ───────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  );
  insert into public.subscriptions (user_id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── businesses ───────────────────────────────────────────────────────────────
create table public.businesses (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references public.profiles (id) on delete cascade,
  name              text not null check (char_length(name) between 1 and 120),
  category          text,
  city              text,
  address           text,
  phone             text,
  google_place_id   text,
  google_review_url text check (google_review_url is null or google_review_url ~ '^https://'),
  -- Unguessable id used in the public review link (/r/<slug>).
  public_slug       text not null unique default left(replace(gen_random_uuid()::text, '-', ''), 12),
  products          text[] not null default '{}' check (cardinality(products) <= 20),
  review_languages  text[] not null default '{en}' check (cardinality(review_languages) between 1 and 10),
  reply_tone        text not null default 'friendly'
                      check (reply_tone in ('friendly', 'professional', 'warm', 'formal')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index businesses_owner_created_idx on public.businesses (owner_id, created_at);

alter table public.businesses enable row level security;

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

create policy "businesses: owner reads own"
  on public.businesses for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy "businesses: owner creates own"
  on public.businesses for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "businesses: owner updates own"
  on public.businesses for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "businesses: owner deletes own"
  on public.businesses for delete to authenticated
  using ((select auth.uid()) = owner_id);

grant select, delete on public.businesses to authenticated;
grant insert (owner_id, name, category, city, address, phone, google_place_id, google_review_url,
              products, review_languages, reply_tone)
  on public.businesses to authenticated;
grant update (name, category, city, address, phone, google_place_id, google_review_url,
              products, review_languages, reply_tone)
  on public.businesses to authenticated;

-- ── public review page lookup ────────────────────────────────────────────────
-- The only way anonymous customers can see business data: public fields, by slug.
create or replace function public.get_review_page(p_slug text)
returns table (
  name              text,
  category          text,
  city              text,
  google_review_url text,
  review_languages  text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select b.name, b.category, b.city, b.google_review_url, b.review_languages
  from public.businesses b
  where b.public_slug = p_slug;
$$;

revoke execute on function public.get_review_page(text) from public;
grant execute on function public.get_review_page(text) to anon, authenticated;
