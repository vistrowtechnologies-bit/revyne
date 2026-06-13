-- Fix: RLS Policy Always True on review_requests and generated_reviews
--
-- The previous always-true INSERT policies (WITH CHECK (true)) allowed any anonymous
-- caller to insert arbitrary rows directly via the Supabase client, bypassing the
-- validation inside save_review_request(). Replace them with conditions that mirror
-- the function's own guards: the target business must exist and have public reviews on.

-- ── review_requests ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS allow_insert_review_requests ON public.review_requests;

CREATE POLICY "anon_insert_review_requests"
  ON public.review_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id = business_id
        AND public_reviews_enabled = true
    )
  );

-- ── generated_reviews ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS allow_insert_generated_reviews ON public.generated_reviews;

CREATE POLICY "anon_insert_generated_reviews"
  ON public.generated_reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id = business_id
        AND public_reviews_enabled = true
    )
  );
