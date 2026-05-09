create table if not exists public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  identifier text not null,
  created_at timestamptz not null default now()
);

alter table public.rate_limit_events enable row level security;

create policy "Admins can view rate limit events"
on public.rate_limit_events
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

create index if not exists rate_limit_events_lookup_idx
on public.rate_limit_events(bucket, identifier, created_at desc);

alter table public.support_tickets
drop constraint if exists support_tickets_category_check;

alter table public.support_tickets
add constraint support_tickets_category_check check (
  category in (
    'general',
    'bug_report',
    'login',
    'payment',
    'ai_generation',
    'review_page',
    'business_profile'
  )
);

create or replace function public.enforce_support_ticket_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  hour_count integer;
  day_count integer;
begin
  select count(*) into hour_count
  from public.support_tickets
  where user_id = new.user_id
    and created_at > now() - interval '1 hour';

  if hour_count >= 5 then
    raise exception 'Please wait before creating more support tickets.';
  end if;

  select count(*) into day_count
  from public.support_tickets
  where user_id = new.user_id
    and created_at > now() - interval '1 day';

  if day_count >= 20 then
    raise exception 'Daily support ticket limit reached. Please contact revyneai@gmail.com for urgent help.';
  end if;

  return new;
end;
$$;

drop trigger if exists support_ticket_rate_limit on public.support_tickets;

create trigger support_ticket_rate_limit
before insert on public.support_tickets
for each row
execute function public.enforce_support_ticket_rate_limit();

revoke execute on function public.enforce_support_ticket_rate_limit() from public, anon, authenticated;
