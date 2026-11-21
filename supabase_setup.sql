
-- ==========================================
-- PADMA CAFE DATABASE SETUP
-- Run in Supabase SQL Editor
-- ==========================================

create extension if not exists pgcrypto;

-- ==========================================
-- CUSTOMER PROFILES
-- ==========================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  address text not null default '',
  role text not null default 'customer'
    check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

-- ==========================================
-- ORDERS
-- ==========================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,

  customer_name text not null default '',
  customer_phone text not null default '',
  customer_address text not null default '',

  total_amount numeric(12,2) not null default 0
    check (total_amount >= 0),

  status text not null default 'pending'
    check (status in (
      'pending',
      'confirmed',
      'cancelled',
      'preparing',
      'completed'
    )),

  approval_status text not null default 'not_required'
    check (approval_status in (
      'not_required',
      'awaiting_customer',
      'accepted',
      'rejected'
    )),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==========================================
-- ORDER ITEMS
-- ==========================================

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null
    references public.orders(id) on delete cascade,

  item_id text not null,
  item_name text not null,

  unit_price numeric(12,2) not null
    check (unit_price >= 0),

  quantity integer not null
    check (quantity > 0),

  line_total numeric(12,2) not null
    check (line_total >= 0),

  item_status text not null default 'active'
    check (item_status in ('active','unavailable')),

  created_at timestamptz not null default now()
);

-- ==========================================
-- AUTO CREATE CUSTOMER PROFILE
-- ==========================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  insert into public.profiles (
    id,
    full_name,
    phone,
    address
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.raw_user_meta_data->>'phone',''),
    coalesce(new.raw_user_meta_data->>'address','')
  )
  on conflict (id) do nothing;

  return new;

end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

-- ==========================================
-- ADMIN CHECK
-- ==========================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- ==========================================
-- ENABLE ROW LEVEL SECURITY
-- ==========================================

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- ==========================================
-- PROFILE POLICIES
-- ==========================================

drop policy if exists
"profile read self or admin"
on public.profiles;

create policy "profile read self or admin"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_admin()
);

drop policy if exists
"profile update self"
on public.profiles;

create policy "profile update self"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
)
with check (
  id = auth.uid()
  and role = 'customer'
);

-- ==========================================
-- ORDER POLICIES
-- ==========================================

drop policy if exists
"orders read own or admin"
on public.orders;

create policy "orders read own or admin"
on public.orders
for select
to authenticated
using (
  customer_id = auth.uid()
  or public.is_admin()
);

drop policy if exists
"orders create own"
on public.orders;

create policy "orders create own"
on public.orders
for insert
to authenticated
with check (
  customer_id = auth.uid()
);

drop policy if exists
"orders admin update"
on public.orders;

create policy "orders admin update"
on public.orders
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

-- ==========================================
-- ORDER ITEM POLICIES
-- ==========================================

drop policy if exists
"items read own or admin"
on public.order_items;

create policy "items read own or admin"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and (
        o.customer_id = auth.uid()
        or public.is_admin()
      )
  )
);

drop policy if exists
"items insert own order"
on public.order_items;

create policy "items insert own order"
on public.order_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.customer_id = auth.uid()
  )
);

drop policy if exists
"items admin update"
on public.order_items;

create policy "items admin update"
on public.order_items
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

-- ==========================================
-- ADMIN MARK ITEM UNAVAILABLE
-- ==========================================

create or replace function
public.admin_mark_item_unavailable(
  p_item_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order uuid;
  v_total numeric;
begin

  if not public.is_admin() then
    raise exception 'শুধু অ্যাডমিন এই কাজ করতে পারবেন';
  end if;

  select order_id
  into v_order
  from public.order_items
  where id = p_item_id
  for update;

  if v_order is null then
    raise exception 'আইটেম পাওয়া যায়নি';
  end if;

  update public.order_items
  set item_status = 'unavailable'
  where id = p_item_id;

  select coalesce(sum(line_total),0)
  into v_total
  from public.order_items
  where order_id = v_order
    and item_status = 'active';

  update public.orders
  set
    total_amount = v_total,
    approval_status = 'awaiting_customer',
    status = 'pending',
    updated_at = now()
  where id = v_order;

  return jsonb_build_object(
    'order_id', v_order,
    'new_total', v_total
  );

end;
$$;

-- ==========================================
-- CUSTOMER APPROVES REMAINING ITEMS
-- ==========================================

create or replace function
public.customer_approve_remaining_order(
  p_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin

  update public.orders
  set
    approval_status = 'accepted',
    updated_at = now()
  where id = p_order_id
    and customer_id = auth.uid()
    and approval_status = 'awaiting_customer'
    and status = 'pending';

  if not found then
    raise exception 'এই অর্ডারের অনুমতি দেওয়া যাচ্ছে না';
  end if;

end;
$$;

-- ==========================================
-- CUSTOMER CANCELS WHOLE ORDER
-- ==========================================

create or replace function
public.customer_cancel_changed_order(
  p_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin

  update public.orders
  set
    approval_status = 'rejected',
    status = 'cancelled',
    updated_at = now()
  where id = p_order_id
    and customer_id = auth.uid()
    and approval_status = 'awaiting_customer'
    and status = 'pending';

  if not found then
    raise exception 'এই অর্ডার বাতিল করা যাচ্ছে না';
  end if;

end;
$$;

-- ==========================================
-- FUNCTION PERMISSIONS
-- ==========================================

grant execute on function
public.admin_mark_item_unavailable(uuid)
to authenticated;

grant execute on function
public.customer_approve_remaining_order(uuid)
to authenticated;

grant execute on function
public.customer_cancel_changed_order(uuid)
to authenticated;

-- ==========================================
-- ENABLE REALTIME
-- ==========================================

do $$
begin

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then

    alter publication supabase_realtime
    add table public.orders;

  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'order_items'
  ) then

    alter publication supabase_realtime
    add table public.order_items;

  end if;

end;
$$;

-- ==========================================
-- SETUP COMPLETE
-- ==========================================
