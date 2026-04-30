alter table if exists public.review_requests enable row level security;
alter table if exists public.generated_reviews enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('review_requests', 'generated_reviews')
      and (
        qual in ('true', '(true)')
        or with_check in ('true', '(true)')
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end $$;

create policy "Owners can view own review requests"
on public.review_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.businesses
    where businesses.id = review_requests.business_id
      and businesses.owner_id = auth.uid()
  )
);

create policy "Public can create review requests for enabled businesses"
on public.review_requests
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.businesses
    where businesses.id = review_requests.business_id
      and businesses.public_reviews_enabled = true
      and businesses.public_token is not null
  )
);

create policy "Owners can view own generated reviews"
on public.generated_reviews
for select
to authenticated
using (
  exists (
    select 1
    from public.businesses
    where businesses.id = generated_reviews.business_id
      and businesses.owner_id = auth.uid()
  )
);

create policy "Public can create generated reviews for enabled businesses"
on public.generated_reviews
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.businesses
    where businesses.id = generated_reviews.business_id
      and businesses.public_reviews_enabled = true
      and businesses.public_token is not null
  )
  and exists (
    select 1
    from public.review_requests
    where review_requests.id = generated_reviews.review_request_id
      and review_requests.business_id = generated_reviews.business_id
  )
);

do $$
declare
  function_record record;
begin
  for function_record in
    select n.nspname as schema_name, p.proname as function_name, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('handle_new_user', 'rls_auto_enable')
  loop
    execute format(
      'revoke execute on function %I.%I(%s) from public, anon, authenticated',
      function_record.schema_name,
      function_record.function_name,
      function_record.args
    );
  end loop;
end $$;
