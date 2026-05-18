-- ─────────────────────────────────────────────────────────────────────────────
-- Rate-limit public review submissions per business to reduce spam / fake stats.
-- The SECURITY DEFINER function save_review_request now rejects more than
-- 200 submissions per business in any rolling 1-hour window.
-- ─────────────────────────────────────────────────────────────────────────────

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
  v_request_id  uuid;
  v_suggestion  text;
  v_recent_count bigint;
BEGIN
  -- Validate rating
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  -- Validate business exists and has public reviews enabled
  IF NOT EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = p_business_id AND public_reviews_enabled = true
  ) THEN
    RAISE EXCEPTION 'Business not found or reviews disabled';
  END IF;

  -- Rate limit: max 200 public submissions per business per rolling hour.
  -- This prevents automated spam from inflating dashboard metrics.
  SELECT COUNT(*) INTO v_recent_count
  FROM public.review_requests
  WHERE business_id = p_business_id
    AND source = 'public_page'
    AND created_at >= NOW() - INTERVAL '1 hour';

  IF v_recent_count >= 200 THEN
    RAISE EXCEPTION 'Too many review submissions for this business. Please try again later.';
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

  -- Insert generated review suggestions if provided (up to 3)
  IF array_length(p_suggestions, 1) > 0 THEN
    FOREACH v_suggestion IN ARRAY p_suggestions[1:3] LOOP
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

-- Re-grant execute (function replaced above, grants need reapplying)
GRANT EXECUTE ON FUNCTION public.save_review_request(uuid, integer, text, text, text[])
  TO anon, authenticated, service_role;
