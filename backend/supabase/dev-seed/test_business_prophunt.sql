-- DEV ONLY — never run against revyne-prod.
-- Gives the prophuntllp@gmail.com test account an unlinked business so the
-- web build can be explored without the Google profile connect step (which
-- isn't built for the browser yet). verified_at / gbp_* stay null on purpose.
--
-- Run: npx supabase db query --linked -f supabase/dev-seed/test_business_prophunt.sql

insert into public.businesses (owner_id, name, category, city, address, products, review_languages, reply_tone)
select u.id, 'Prophunt Test Store', 'Fabrication', 'Pune', 'Test address — not a real listing',
       array['Gates', 'Grills'], array['en', 'hi'], 'friendly'
from auth.users u
where u.email = 'prophuntllp@gmail.com'
  and not exists (select 1 from public.businesses b where b.owner_id = u.id);
