-- ─────────────────────────────────────────────────────────────────────────────
-- Google Business Profile integration tables
-- gmb_tokens  : one row per user; stores OAuth access/refresh tokens + selected
--               GMB location.  Tokens are sensitive — only accessible via the
--               service role (edge functions), never directly from the client.
-- gmb_reviews : cached copy of reviews pulled from the GMB API; keeps the UI
--               fast and avoids hitting Google quota on every page load.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── GMB OAuth tokens ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gmb_tokens (
  user_id       uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token  text        NOT NULL,
  refresh_token text,
  expires_at    timestamptz,
  account_name  text,   -- e.g. "accounts/1234567890"
  location_id   text,   -- e.g. "accounts/1234567890/locations/9876543210"
  location_name text,   -- human-readable business name from GMB
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gmb_tokens ENABLE ROW LEVEL SECURITY;

-- Tokens are sensitive — only accessible via service role (edge functions).
-- The client never reads or writes this table directly.
CREATE POLICY "service_role_all_gmb_tokens" ON public.gmb_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── GMB Reviews cache ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gmb_reviews (
  id                text        PRIMARY KEY,  -- full GMB review resource name
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id       text,
  reviewer_name     text,
  reviewer_photo    text,
  star_rating       text,  -- FIVE | FOUR | THREE | TWO | ONE
  comment           text,
  create_time       timestamptz,
  update_time       timestamptz,
  reply_comment     text,
  reply_update_time timestamptz,
  synced_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gmb_reviews ENABLE ROW LEVEL SECURITY;

-- Owners can read their own cached reviews
CREATE POLICY "owner_select_gmb_reviews" ON public.gmb_reviews
  FOR SELECT USING (auth.uid() = user_id);

-- Service role has full access (for cache writes from edge functions)
CREATE POLICY "service_role_all_gmb_reviews" ON public.gmb_reviews
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Index for fast per-user queries sorted by review date
CREATE INDEX IF NOT EXISTS gmb_reviews_user_create_idx
  ON public.gmb_reviews (user_id, create_time DESC);

-- Grant select on gmb_reviews to authenticated users (RLS still applies)
GRANT SELECT ON public.gmb_reviews TO authenticated;
GRANT ALL   ON public.gmb_reviews TO service_role;
GRANT ALL   ON public.gmb_tokens  TO service_role;
