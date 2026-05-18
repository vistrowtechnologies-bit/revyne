-- Track when a customer actually copies the generated review draft
-- (the strongest signal they're about to post on Google)
ALTER TABLE public.review_requests
  ADD COLUMN IF NOT EXISTS draft_copied  boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS copied_at     timestamptz;

-- Index for the dashboard query (only count copied sessions)
CREATE INDEX IF NOT EXISTS idx_review_requests_business_copied
  ON public.review_requests (business_id, draft_copied, created_at DESC);
