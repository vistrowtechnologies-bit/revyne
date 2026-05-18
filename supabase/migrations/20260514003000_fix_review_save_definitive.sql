-- ─────────────────────────────────────────────────────────────────────────
-- DEFINITIVE FIX: Ensure all existing businesses have public_reviews_enabled
-- and create a SECURITY DEFINER RPC function so any caller (anon, auth, or
-- the publishable-key client) can insert review_requests without RLS issues.
-- ─────────────────────────────────────────────────────────────────────────

-- 1. Make sure the column exists (idempotent)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS public_reviews_enabled boolean NOT NULL DEFAULT true;

-- 2. Set ALL existing businesses to enabled (covers records saved before this fix)
UPDATE public.businesses
  SET public_reviews_enabled = true
  WHERE public_reviews_enabled IS NULL OR public_reviews_enabled = false;

-- 3. Drop old restrictive policies and replace with open ones (no TO clause = all roles)
DROP POLICY IF EXISTS anon_insert_review_requests ON public.review_requests;
DROP POLICY IF EXISTS anon_insert_generated_reviews ON public.generated_reviews;
DROP POLICY IF EXISTS anon_read_public_businesses ON public.businesses;

CREATE POLICY allow_insert_review_requests
  ON public.review_requests
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY allow_insert_generated_reviews
  ON public.generated_reviews
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to read public businesses
CREATE POLICY allow_read_public_businesses
  ON public.businesses
  FOR SELECT
  USING (public_reviews_enabled = true);

-- 4. Create a SECURITY DEFINER function that inserts a review_request
--    This runs as the postgres superuser, bypassing RLS entirely.
--    Called via supabase.rpc('save_review_request', {...})
CREATE OR REPLACE FUNCTION public.save_review_request(
  p_business_id   uuid,
  p_rating        integer,
  p_experience    text    DEFAULT NULL,
  p_language      text    DEFAULT 'English',
  p_suggestions   text[]  DEFAULT ARRAY[]::text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id uuid;
  v_suggestion  text;
BEGIN
  -- Validate rating
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  -- Validate business exists and is public
  IF NOT EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = p_business_id AND public_reviews_enabled = true
  ) THEN
    RAISE EXCEPTION 'Business not found or reviews disabled';
  END IF;

  -- Insert the review request
  INSERT INTO public.review_requests (
    business_id,
    rating,
    customer_experience,
    customer_language,
    source
  ) VALUES (
    p_business_id,
    p_rating,
    p_experience,
    p_language,
    'public_page'
  )
  RETURNING id INTO v_request_id;

  -- Insert generated review suggestions if provided
  IF array_length(p_suggestions, 1) > 0 THEN
    FOREACH v_suggestion IN ARRAY p_suggestions LOOP
      INSERT INTO public.generated_reviews (
        review_request_id,
        business_id,
        suggestion
      ) VALUES (
        v_request_id,
        p_business_id,
        v_suggestion
      );
    END LOOP;
  END IF;

  RETURN v_request_id;
END;
$$;

-- Grant execute to all roles (anon, authenticated, service_role)
GRANT EXECUTE ON FUNCTION public.save_review_request(uuid, integer, text, text, text[])
  TO anon, authenticated, service_role;
