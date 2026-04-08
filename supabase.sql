-- Expense Tracker: schema + RLS
-- Run this in the Supabase SQL editor.

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_created_at_idx
  on public.transactions (user_id, created_at desc);

alter table public.transactions enable row level security;

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own"
  on public.transactions
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own"
  on public.transactions
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own"
  on public.transactions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own"
  on public.transactions
  for delete
  to authenticated
  using (user_id = auth.uid());

