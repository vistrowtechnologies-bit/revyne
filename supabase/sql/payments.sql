alter table public.profiles
  add column if not exists plan text not null default 'free',
  add column if not exists plan_status text not null default 'free',
  add column if not exists razorpay_subscription_id text,
  add column if not exists razorpay_customer_id text,
  add column if not exists plan_current_start timestamptz,
  add column if not exists plan_current_end timestamptz;

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_id text unique,
  event_name text not null,
  provider text not null default 'razorpay',
  plan text,
  razorpay_subscription_id text,
  razorpay_payment_id text,
  status text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.payment_events enable row level security;

create policy "Users can view own payment events"
on public.payment_events
for select
to authenticated
using (auth.uid() = user_id);

create index if not exists payment_events_user_id_idx on public.payment_events(user_id);
create index if not exists payment_events_subscription_id_idx on public.payment_events(razorpay_subscription_id);
create index if not exists profiles_razorpay_subscription_id_idx on public.profiles(razorpay_subscription_id);
