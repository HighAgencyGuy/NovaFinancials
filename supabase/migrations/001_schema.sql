-- NOVA Bank schema — run in Supabase SQL Editor
-- Auth is managed manually (not Supabase Auth).

-- PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  full_name text not null,
  email text unique not null,
  password_hash text not null,
  account_number text unique not null,
  account_type text not null check (
    account_type in ('Savings', 'Checking', 'Premium', 'Business')
  ),
  balance bigint not null default 0,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'suspended', 'rejected')
  ),
  role text not null default 'user' check (
    role in ('user', 'admin')
  ),
  pin_hash text,
  last_login timestamptz
);

-- TRANSACTIONS TABLE
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('credit', 'debit')),
  category text not null check (
    category in (
      'transfer', 'wire', 'deposit', 'fee',
      'investment', 'loan', 'admin'
    )
  ),
  amount bigint not null,
  balance_before bigint not null,
  balance_after bigint not null,
  description text not null,
  reference text unique not null,
  counterparty text,
  status text not null default 'completed' check (
    status in ('completed', 'pending', 'failed')
  )
);

-- NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null check (type in ('credit', 'debit', 'info', 'warning')),
  read boolean not null default false
);

-- INDEXES
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_created_at on public.transactions(created_at desc);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(user_id, read);

-- ATOMIC LOCAL TRANSFER
create or replace function public.transfer_funds(
  sender_id uuid,
  recipient_id uuid,
  amount_kobo bigint,
  description text,
  reference text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_balance bigint;
  recipient_balance bigint;
  new_sender_balance bigint;
  new_recipient_balance bigint;
begin
  select balance into sender_balance
    from public.profiles
    where id = sender_id
    for update;

  select balance into recipient_balance
    from public.profiles
    where id = recipient_id
    for update;

  if sender_balance is null or recipient_balance is null then
    return json_build_object('error', 'Account not found');
  end if;

  if sender_balance < amount_kobo then
    return json_build_object('error', 'Insufficient balance');
  end if;

  new_sender_balance := sender_balance - amount_kobo;
  new_recipient_balance := recipient_balance + amount_kobo;

  update public.profiles
    set balance = new_sender_balance
    where id = sender_id;

  update public.profiles
    set balance = new_recipient_balance
    where id = recipient_id;

  insert into public.transactions (
    id, user_id, type, category, amount,
    balance_before, balance_after,
    description, reference, counterparty, status
  ) values (
    gen_random_uuid(), sender_id, 'debit', 'transfer',
    amount_kobo, sender_balance, new_sender_balance,
    description, reference, recipient_id::text, 'completed'
  );

  insert into public.transactions (
    id, user_id, type, category, amount,
    balance_before, balance_after,
    description, reference, counterparty, status
  ) values (
    gen_random_uuid(), recipient_id, 'credit', 'transfer',
    amount_kobo, recipient_balance, new_recipient_balance,
    description, reference || '-IN', sender_id::text, 'completed'
  );

  return json_build_object(
    'success', true,
    'sender_balance', new_sender_balance,
    'recipient_balance', new_recipient_balance
  );
end;
$$;

-- ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.notifications enable row level security;

create policy "Users read own profile" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (true);
create policy "Users insert profile on register" on public.profiles for insert with check (true);
create policy "Users read own transactions" on public.transactions for select using (true);
create policy "Insert transactions" on public.transactions for insert with check (true);
create policy "Users read own notifications" on public.notifications for select using (true);
create policy "Insert notifications" on public.notifications for insert with check (true);
create policy "Update notifications" on public.notifications for update using (true);

-- SEED ADMIN (replace password_hash with bcrypt hash of Admin@2025, 12 rounds)
-- insert into public.profiles (
--   full_name, email, password_hash, account_number, account_type,
--   balance, status, role, pin_hash
-- ) values (
--   'NOVA Admin', 'admin@novabank.com', '<bcrypt-hash>', 'NOVA-ADMIN-0001',
--   'Savings', 0, 'approved', 'admin', '<bcrypt-hash-of-0000>'
-- );
