-- Padma Cafe Database Setup (Profiles, Store Status, Customer Orders, Offline Sales & RPCs)

create table if not exists public.store_settings (
  id int primary key,
  is_online boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id, is_online)
values (1, true)
on conflict (id) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'customer',
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  sale_type text not null default 'online', -- 'online' | 'offline'
  customer_user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  delivery_address text,
  note text,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric not null default 0,
  status text not null default 'pending',
  delivery_minutes int not null default 15,
  delivery_started_at timestamptz,
  created_at timestamptz not null default now()
);

-- Storage bucket for customer avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Enable RLS
alter table public.store_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.orders enable row level security;

-- Helper function to check admin email
create or replace function public.is_padma_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@padmacafe.com';
$$;

-- Store Status Policies & RPCs
drop policy if exists "Anyone can read store settings" on public.store_settings;
create policy "Anyone can read store settings"
  on public.store_settings for select
  using (true);

create or replace function public.get_store_status()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select is_online from public.store_settings where id = 1), true);
$$;

create or replace function public.set_store_status(p_is_online boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_padma_admin() then
    raise exception 'Only admin can update store status';
  end if;

  update public.store_settings
  set is_online = p_is_online, updated_at = now()
  where id = 1;

  return p_is_online;
end;
$$;

-- Profile Policies
drop policy if exists "Users can view own profile or admin all" on public.profiles;
create policy "Users can view own profile or admin all"
  on public.profiles for select
  using (auth.uid() = id or public.is_padma_admin());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Avatar Storage Policies
drop policy if exists "Public avatar read" on storage.objects;
create policy "Public avatar read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Authenticated avatar upload" on storage.objects;
create policy "Authenticated avatar upload"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "Authenticated avatar update" on storage.objects;
create policy "Authenticated avatar update"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- Orders Policies
drop policy if exists "Customers view own orders and admin views all" on public.orders;
create policy "Customers view own orders and admin views all"
  on public.orders for select
  using (
    public.is_padma_admin()
    or customer_user_id = auth.uid()
    or lower(customer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "Admin can update orders" on public.orders;
create policy "Admin can update orders"
  on public.orders for update
  using (public.is_padma_admin());

-- Place Customer Order RPC (Blocks if store is offline)
create or replace function public.place_customer_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_delivery_address text,
  p_note text,
  p_items jsonb,
  p_total_amount numeric
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_online boolean;
  v_order public.orders;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select is_online into v_online from public.store_settings where id = 1;
  if coalesce(v_online, true) = false then
    raise exception 'Restaurant is currently offline';
  end if;

  insert into public.orders (
    sale_type,
    customer_user_id,
    customer_name,
    customer_email,
    customer_phone,
    delivery_address,
    note,
    items,
    total_amount,
    status
  )
  values (
    'online',
    auth.uid(),
    p_customer_name,
    coalesce(nullif(p_customer_email, ''), auth.jwt() ->> 'email'),
    p_customer_phone,
    p_delivery_address,
    p_note,
    p_items,
    p_total_amount,
    'pending'
  )
  returning * into v_order;

  return v_order;
end;
$$;

-- Admin Offline Sale RPC (Saves as offline sale & returns full row for receipt)
create or replace function public.admin_create_offline_sale(
  p_items jsonb,
  p_total_amount numeric,
  p_customer_name text default 'অফলাইন কাস্টমার',
  p_customer_email text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  if not public.is_padma_admin() then
    raise exception 'Only admin can create offline sales';
  end if;

  insert into public.orders (
    sale_type,
    customer_user_id,
    customer_name,
    customer_email,
    customer_phone,
    delivery_address,
    items,
    total_amount,
    status
  )
  values (
    'offline',
    auth.uid(),
    coalesce(nullif(p_customer_name, ''), 'অফলাইন কাস্টমার'),
    coalesce(nullif(p_customer_email, ''), auth.jwt() ->> 'email'),
    'Counter Sale',
    'Padma Cafe Counter (Offline)',
    p_items,
    p_total_amount,
    'completed'
  )
  returning * into v_order;

  return v_order;
end;
$$;
