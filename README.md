# Finance Glass (HTML/CSS/JS + Supabase)

Modern financial tracking app with:

- Supabase **email/password** auth
- Multi-page navigation: **Dashboard**, **Expenses**, **SIP**, **EMI**, **About SIP**
- Expense tracking with **categories**
- Dashboard summary + charts (Chart.js via CDN)
- SIP & EMI calculators (real-time) + amortization table
- Glassmorphism UI (blur, transparency, gradients) with responsive layout
- No build tools (static site)

## 1) Create a Supabase project

1. Create a project in Supabase.
2. Go to **Authentication → Providers** and ensure **Email** is enabled.

## 2) Create the database table + RLS policies

In Supabase, open **SQL Editor** and run:

```sql
-- You can also run the repo file: supabase.sql

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category text not null default 'Uncategorized',
  description text not null default '',
  created_at timestamptz not null default now()
);

alter table public.transactions
  add column if not exists category text not null default 'Uncategorized';

create index if not exists transactions_user_id_created_at_idx
  on public.transactions (user_id, created_at desc);

create index if not exists transactions_user_id_category_idx
  on public.transactions (user_id, category);

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
```

## 3) Add your Supabase keys to the frontend

Open:

- `assets/supabaseClient.js`

Replace:

- `SUPABASE_URL` with your **Project URL**
- `SUPABASE_ANON_KEY` with your **anon public key**

You can find both in **Project Settings → API**.

## 4) Run locally

This is a static site. You can use any static server.

### Option A: VS Code / Cursor Live Server

Open `index.html` with Live Server.

### Option B: Python

From the project directory:

```bash
python -m http.server 5173
```

Then open:

- `http://localhost:5173`

## Notes / Troubleshooting

- If signup requires email confirmation, Supabase may show “Signup successful…” and you must confirm your email before logging in.
- If you see RLS errors when adding/listing transactions, re-check that:
  - you ran the SQL
  - RLS is enabled on `public.transactions`
  - policies exist and target role `authenticated`# Finance_tool
# Finance_tool
