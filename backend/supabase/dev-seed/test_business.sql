-- DEV ONLY — never run against revyne-prod.
-- Gives the test account a business without Google Business Profile
-- verification, so the app can be built and tested before Google approves
-- our GBP API access. verified_at / gbp_* stay null on purpose.
--
-- Run: npx supabase db query --linked -f supabase/dev-seed/test_business.sql

insert into public.businesses (owner_id, name, category, city, address, products, review_languages, reply_tone)
select u.id, 'RevYne Test Store', 'Retail Store', 'Mumbai', 'Test address — not a real listing',
       array['Sample product A', 'Sample product B'], array['en', 'hi'], 'friendly'
from auth.users u
where u.email = 'pranav28.nair@gmail.com'
  and not exists (select 1 from public.businesses b where b.owner_id = u.id);
