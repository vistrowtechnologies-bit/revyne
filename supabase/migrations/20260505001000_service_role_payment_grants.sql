grant usage on schema public to service_role;

grant select, insert, update on public.profiles to service_role;
grant select, insert on public.rate_limit_events to service_role;
grant select, insert on public.payment_events to service_role;
