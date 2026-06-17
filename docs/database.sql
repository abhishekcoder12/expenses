-- Smart Expense Tracker - Level 2
-- Run this in Supabase SQL Editor before starting the backend.
-- If you already ran the old Level 1 SQL, run this again. It safely creates the new income table.

create extension if not exists pgcrypto;

create table if not exists public.users (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(name) >= 2),
    email text unique not null,
    password_hash text not null,
    created_at timestamptz default now()
);

create table if not exists public.expenses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    amount numeric(12, 2) not null check (amount > 0),
    category text not null,
    payment_method text not null,
    description text,
    expense_date date not null,
    created_at timestamptz default now()
);

create table if not exists public.income (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    amount numeric(12, 2) not null check (amount > 0),
    source text not null,
    note text,
    income_date date not null,
    created_at timestamptz default now()
);

create index if not exists idx_expenses_user_id on public.expenses(user_id);
create index if not exists idx_expenses_expense_date on public.expenses(expense_date);
create index if not exists idx_expenses_category on public.expenses(category);

create index if not exists idx_income_user_id on public.income(user_id);
create index if not exists idx_income_income_date on public.income(income_date);
create index if not exists idx_income_source on public.income(source);

-- Security note:
-- The backend uses SUPABASE_SERVICE_ROLE_KEY from backend/.env.
-- Keep this key private and never paste it into frontend code.
-- RLS is enabled so anon/public keys cannot freely read or write these tables.

alter table public.users enable row level security;
alter table public.expenses enable row level security;
alter table public.income enable row level security;
