-- ─────────────────────────────────────────────────────────────────────────────
-- SECURITY: lock billing + admin columns against client writes.
--
-- Before this migration, an authenticated user could run
--   supabase.from('profiles').update({ plan: 'pro_max', plan_status: 'active' })
-- from the browser console and get a paid plan for free, or upsert their own
-- usage_limits row to reset monthly AI generation counters.
--
-- Trigger-based so it holds regardless of how RLS policies are configured in
-- the dashboard. Only the service role (Razorpay webhook, edge functions) may
-- change these fields.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. profiles: billing/admin columns are service-role-only
CREATE OR REPLACE FUNCTION public.protect_profile_billing_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text := coalesce(auth.jwt() ->> 'role', current_setting('role', true));
BEGIN
  IF jwt_role = 'service_role' OR current_user = 'postgres' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- New profiles always start on the free plan, never as admin.
    NEW.plan := 'free';
    NEW.plan_status := 'free';
    NEW.is_admin := false;
    NEW.razorpay_subscription_id := NULL;
    NEW.razorpay_customer_id := NULL;
    NEW.plan_current_start := NULL;
    NEW.plan_current_end := NULL;
  ELSE
    -- Updates: silently keep the previous values for protected columns.
    NEW.plan := OLD.plan;
    NEW.plan_status := OLD.plan_status;
    NEW.is_admin := OLD.is_admin;
    NEW.razorpay_subscription_id := OLD.razorpay_subscription_id;
    NEW.razorpay_customer_id := OLD.razorpay_customer_id;
    NEW.plan_current_start := OLD.plan_current_start;
    NEW.plan_current_end := OLD.plan_current_end;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_billing_columns_trg ON public.profiles;
CREATE TRIGGER protect_profile_billing_columns_trg
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_billing_columns();

-- 2. usage_limits: only the service role may write usage counters.
--    (generate-ai edge function now increments usage server-side.)
CREATE OR REPLACE FUNCTION public.protect_usage_limits_writes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text := coalesce(auth.jwt() ->> 'role', current_setting('role', true));
BEGIN
  IF jwt_role = 'service_role' OR current_user = 'postgres' THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'usage_limits is read-only for clients';
END;
$$;

DROP TRIGGER IF EXISTS protect_usage_limits_writes_trg ON public.usage_limits;
CREATE TRIGGER protect_usage_limits_writes_trg
  BEFORE INSERT OR UPDATE OR DELETE ON public.usage_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_usage_limits_writes();

-- 3. businesses: cached owner-plan snapshot columns are also client-writable
--    and feed the public review page's Pro Max gate. Lock them too.
CREATE OR REPLACE FUNCTION public.protect_business_plan_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text := coalesce(auth.jwt() ->> 'role', current_setting('role', true));
BEGIN
  IF jwt_role = 'service_role' OR current_user = 'postgres' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.owner_plan := 'free';
    NEW.owner_plan_status := 'free';
    NEW.owner_plan_current_end := NULL;
  ELSE
    NEW.owner_plan := OLD.owner_plan;
    NEW.owner_plan_status := OLD.owner_plan_status;
    NEW.owner_plan_current_end := OLD.owner_plan_current_end;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_business_plan_snapshot_trg ON public.businesses;
CREATE TRIGGER protect_business_plan_snapshot_trg
  BEFORE INSERT OR UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_business_plan_snapshot();
