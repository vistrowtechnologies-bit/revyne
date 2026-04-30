create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  customer_name text,
  customer_email text,
  subject text not null,
  category text not null default 'general',
  priority text not null default 'normal',
  status text not null default 'open',
  message text not null,
  admin_response text,
  assigned_to text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_tickets_category_check check (
    category in (
      'general',
      'login',
      'payment',
      'ai_generation',
      'review_page',
      'business_profile'
    )
  ),
  constraint support_tickets_priority_check check (
    priority in ('low', 'normal', 'medium', 'high', 'urgent')
  ),
  constraint support_tickets_status_check check (
    status in ('open', 'in_review', 'waiting_customer', 'resolved', 'closed')
  )
);

alter table public.support_tickets enable row level security;

create policy "Users can create own support tickets"
on public.support_tickets
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can view own support tickets"
on public.support_tickets
for select
to authenticated
using (auth.uid() = user_id);

create index if not exists support_tickets_user_id_idx on public.support_tickets(user_id);
create index if not exists support_tickets_status_idx on public.support_tickets(status);
create index if not exists support_tickets_priority_idx on public.support_tickets(priority);
create index if not exists support_tickets_created_at_idx on public.support_tickets(created_at desc);
