-- ─────────────────────────────────────────────────────────────────────────────
-- Connect-only onboarding: a business exists in RevYne only after Google
-- confirms the user manages it (Business Profile OAuth, business.manage).
--
--   * gbp_connections holds the Google refresh token per user — service role
--     only, token encrypted by the gbp-connect function before it is stored.
--   * businesses are created exclusively by gbp-connect (service role); clients
--     lose INSERT and may only edit their RevYne preferences. Google-sourced
--     fields change through Google, not by direct table writes.
--   * One Google location can belong to only one RevYne business.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.gbp_connections (
  user_id                 uuid primary key references auth.users (id) on delete cascade,
  google_email            text,
  refresh_token_enc       text not null,  -- AES-GCM, key in GBP_TOKEN_KEY secret
  access_token_enc        text,
  access_token_expires_at timestamptz,
  scope                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.gbp_connections enable row level security;
revoke all on public.gbp_connections from anon, authenticated;

create trigger gbp_connections_set_updated_at
  before update on public.gbp_connections
  for each row execute function public.set_updated_at();

alter table public.businesses
  add column gbp_account  text,         -- accounts/{id}
  add column gbp_location text,         -- locations/{id}
  add column verified_at  timestamptz;  -- when Google confirmed the owner

create unique index businesses_gbp_location_key
  on public.businesses (gbp_location)
  where gbp_location is not null;

-- Creation happens only in gbp-connect after ownership is proven.
drop policy "businesses: owner creates own" on public.businesses;
revoke insert on public.businesses from authenticated;

-- Owners keep editing RevYne-only preferences; Google fields are read-only here.
revoke update on public.businesses from authenticated;
grant update (products, review_languages, reply_tone) on public.businesses to authenticated;
