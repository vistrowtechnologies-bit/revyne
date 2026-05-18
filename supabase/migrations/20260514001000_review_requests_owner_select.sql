-- ─────────────────────────────────────────────────────────────────
-- Allow authenticated business owners to SELECT their own reviews
-- (needed for dashboard stats — loadDashboardStats queries by business_id)
-- ─────────────────────────────────────────────────────────────────

-- review_requests: owners can see all requests for their businesses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'review_requests'
      AND policyname = 'owners_select_own_review_requests'
  ) THEN
    CREATE POLICY owners_select_own_review_requests
      ON public.review_requests
      FOR SELECT
      TO authenticated
      USING (
        business_id IN (
          SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- generated_reviews: owners can see all generated reviews for their businesses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'generated_reviews'
      AND policyname = 'owners_select_own_generated_reviews'
  ) THEN
    CREATE POLICY owners_select_own_generated_reviews
      ON public.generated_reviews
      FOR SELECT
      TO authenticated
      USING (
        business_id IN (
          SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Also ensure review_requests table has RLS enabled
ALTER TABLE IF EXISTS public.review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.generated_reviews ENABLE ROW LEVEL SECURITY;
