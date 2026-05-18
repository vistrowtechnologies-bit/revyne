-- ────────────────────────────────────────────────────────────
-- Allow anonymous visitors (QR/link) to insert review requests
-- and generated reviews without being authenticated.
-- The Edge Function (service role) is the primary path, but
-- these policies ensure direct Supabase calls also work.
-- ────────────────────────────────────────────────────────────

-- review_requests: allow anon insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'review_requests'
      AND policyname = 'anon_insert_review_requests'
  ) THEN
    CREATE POLICY anon_insert_review_requests
      ON public.review_requests
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;

-- generated_reviews: allow anon insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'generated_reviews'
      AND policyname = 'anon_insert_generated_reviews'
  ) THEN
    CREATE POLICY anon_insert_generated_reviews
      ON public.generated_reviews
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;

-- businesses: allow anon SELECT where public_reviews_enabled = true
-- (needed so the public review page can load the business)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'businesses'
      AND policyname = 'anon_read_public_businesses'
  ) THEN
    CREATE POLICY anon_read_public_businesses
      ON public.businesses
      FOR SELECT
      TO anon
      USING (public_reviews_enabled = true);
  END IF;
END $$;

-- Performance index: dashboard stats query (business_id + created_at DESC)
CREATE INDEX IF NOT EXISTS idx_review_requests_business_created
  ON public.review_requests (business_id, created_at DESC);

-- Performance index: usage_limits lookup
CREATE INDEX IF NOT EXISTS idx_usage_limits_user_month
  ON public.usage_limits (user_id, month_key);
