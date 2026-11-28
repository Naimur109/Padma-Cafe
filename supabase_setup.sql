-- =========================================================
-- PADMA CAFE - COMPLETE DATABASE MIGRATION & LIVE MENU PRICING
-- Existing tables and data will be preserved.
-- Timezone: Asia/Dhaka | Currency: BDT
-- =========================================================

begin;

drop function if exists public.place_customer_order(jsonb);
drop function if exists public.place_customer_order(
  jsonb, text, text, text, text, text, text
);
drop function if exists public.admin_create_offline_sale(jsonb);
drop function if exists public.admin_create_offline_sale(jsonb, text);
drop function if exists public.admin_update_menu_item(text, numeric, numeric);
drop function if exists public.admin_update_menu_item(text, numeric, numeric, numeric);

-- ---------------------------------------------------------
-- 1. ADD NEW ORDER & PROFILE COLUMNS, STORE SETTINGS,
--    DAILY EXPENSES & LIVE MENU ITEMS WITH DISCOUNT & TIMER
-- ---------------------------------------------------------

alter table public.orders
  add column if not exists customer_email text default '',
  add column if not exists sale_type text not null default 'online',
  add column if not exists payment_method text not null default 'cod',
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists payment_reference text default '',
  add column if not exists preparation_minutes integer,
  add column if not exists preparation_started_at timestamptz,
  add column if not exists preparation_ends_at timestamptz,
  add column if not exists delivery_minutes integer,
  add column if not exists delivery_started_at timestamptz,
  add column if not exists delivery_ends_at timestamptz,
  add column if not exists completed_at timestamptz;

alter table public.profiles
  add column if not exists avatar_url text default '',
  add column if not exists email text default '';

create table if not exists public.store_settings (
  id integer primary key default 1,
  is_online boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id, is_online)
values (1, true)
on conflict (id) do nothing;

alter table public.store_settings enable row level security;

drop policy if exists "Anyone can read store settings" on public.store_settings;
create policy "Anyone can read store settings"
on public.store_settings
for select
using (true);

drop policy if exists "Admins can update store settings" on public.store_settings;
create policy "Admins can update store settings"
on public.store_settings
for all
using (public.is_admin())
with check (public.is_admin());

create table if not exists public.daily_expenses (
  expense_date date primary key,
  expense_amount numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.daily_expenses enable row level security;

drop policy if exists "Admins can manage daily expenses" on public.daily_expenses;
create policy "Admins can manage daily expenses"
on public.daily_expenses
for all
using (public.is_admin())
with check (public.is_admin());

create table if not exists public.menu_items (
  id text primary key,
  name text not null,
  category text not null,
  price numeric(12,2) not null check (price >= 0),
  discount_percent numeric(5,2) not null default 0 check (discount_percent >= 0 and discount_percent <= 95),
  offer_ends_at timestamptz null,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.menu_items
  add column if not exists offer_ends_at timestamptz null;

insert into public.menu_items (id, name, category, price, discount_percent, offer_ends_at, sort_order)
values
  ('hot_coffee', 'হট কফি', 'পদ্মা স্পেশাল', 50, 0, null, 1),
  ('malai_cha', 'মালাই চা', 'পদ্মা স্পেশাল', 40, 0, null, 2),
  ('dudh_cha', 'দুধ চা', 'পদ্মা স্পেশাল', 30, 0, null, 3),
  ('pora_roti_10', 'পোড়া রুটি', 'পদ্মা স্পেশাল', 10, 0, null, 4),
  ('pora_roti_15', 'পোড়া রুটি', 'পদ্মা স্পেশাল', 15, 0, null, 5),
  ('malai_cha_roti', 'মালাই চা + পোড়া রুটি', 'পদ্মা স্পেশাল', 50, 0, null, 6),
  ('chotpoti', 'চটপটি', 'পদ্মা স্পেশাল', 40, 0, null, 7),
  ('chotpoti_egg', 'চটপটি (ডিম)', 'পদ্মা স্পেশাল', 60, 0, null, 8),
  ('fuchka', 'ফুচকা', 'পদ্মা স্পেশাল', 50, 0, null, 9),
  ('doi_fuchka', 'দই ফুচকা', 'পদ্মা স্পেশাল', 90, 0, null, 10),
  ('doi_chira', 'দই চিড়া', 'পদ্মা স্পেশাল', 80, 0, null, 11),
  ('chicken_tikka_burger', 'চিকেন টিক্কা বার্গার', 'বার্গার', 80, 0, null, 12),
  ('beef_burger', 'বিফ বার্গার', 'বার্গার', 130, 0, null, 13),
  ('kolija_singara', 'কলিজা সিঙ্গারা', 'স্টাটার', 25, 0, null, 14),
  ('french_fries', 'ফ্রেন্স ফ্রাই', 'স্টাটার', 50, 0, null, 15),
  ('chicken_spring_roll', 'চিকেন স্প্রিং রোল', 'স্টাটার', 80, 0, null, 16),
  ('chicken_momos', 'চিকেন মমস', 'স্টাটার', 100, 0, null, 17),
  ('chicken_fry_3pcs', 'চিকেন ফ্রাই (৩ পিস)', 'স্টাটার', 120, 0, null, 18),
  ('cold_coffee', 'কোল্ড কফি', 'শেক', 80, 0, null, 19),
  ('chocolate_shake', 'চকলেট শেক', 'শেক', 90, 0, null, 20),
  ('vanilla_shake', 'ভ্যানিলা শেক', 'শেক', 99, 0, null, 21),
  ('oreo_shake', 'অরিও শেক', 'শেক', 110, 0, null, 22),
  ('kitkat_shake', 'কিটক্যাট শেক', 'শেক', 110, 0, null, 23),
  ('butterscotch_shake', 'বাটারস্কচ শেক (Padma Special)', 'শেক', 110, 0, null, 24),
  ('water', 'পানি', 'সফট ড্রিঙ্কস', 20, 0, null, 25),
  ('mojo', 'মজো', 'সফট ড্রিঙ্কস', 20, 0, null, 26),
  ('combo_hash_khichuri_regular', 'হাঁস+খিচুড়ি (রেগুলার)', 'কম্বো প্যাকেজ', 230, 0, null, 27),
  ('combo_hash_khichuri_special', 'হাঁস+খিচুড়ি (স্পেশাল)', 'কম্বো প্যাকেজ', 270, 0, null, 28)
on conflict (id) do nothing;

alter table public.menu_items enable row level security;

drop policy if exists "Anyone can read menu items" on public.menu_items;
create policy "Anyone can read menu items"
on public.menu_items
for select
using (true);

drop policy if exists "Admins can update menu items" on public.menu_items;
create policy "Admins can update menu items"
on public.menu_items
for all
using (public.is_admin())
with check (public.is_admin());

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'store_settings'
  ) then
    alter publication supabase_realtime add table public.store_settings;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'menu_items'
  ) then
    alter publication supabase_realtime add table public.menu_items;
  end if;
end $$;

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (
    status in (
      'pending',
      'confirmed',
      'preparing',
      'out_for_delivery',
      'completed',
      'cancelled'
    )
  );

alter table public.orders
  drop constraint if exists orders_sale_type_check;

alter table public.orders
  add constraint orders_sale_type_check
  check (sale_type in ('online', 'offline'));

alter table public.orders
  drop constraint if exists orders_payment_method_check;

alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('cod', 'online_qr'));

alter table public.orders
  drop constraint if exists orders_payment_status_check;

alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('unpaid', 'pending_verification', 'paid'));

-- ---------------------------------------------------------
-- 2. ADMIN UPDATE MENU ITEM PRICE, DISCOUNT & OFFER TIMER
-- ---------------------------------------------------------

create or replace function public.admin_update_menu_item(
  p_item_id text,
  p_price numeric,
  p_discount_percent numeric default 0,
  p_offer_hours numeric default null
)
returns table (
  id text,
  name text,
  category text,
  price numeric,
  discount_percent numeric,
  offer_ends_at timestamptz,
  final_price numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_disc numeric(5,2);
  v_offer_end timestamptz;
  v_active_disc numeric(5,2);
  v_final numeric(12,2);
begin
  if not public.is_admin() then
    raise exception 'শুধু অ্যাডমিন খাবারের দাম বা ডিসকাউন্ট আপডেট করতে পারবেন';
  end if;

  if p_price is null or p_price < 0 then
    raise exception 'সঠিক দাম লিখুন';
  end if;

  v_disc := coalesce(p_discount_percent, 0);
  if v_disc < 0 or v_disc > 95 then
    raise exception 'ডিসকাউন্ট ০ থেকে ৯৫ শতাংশের মধ্যে দিন';
  end if;

  if v_disc > 0 and p_offer_hours is not null and p_offer_hours > 0 then
    v_offer_end := now() + make_interval(secs => (p_offer_hours * 3600)::integer);
  else
    v_offer_end := null;
  end if;

  v_active_disc := case
    when v_disc > 0 and (v_offer_end is null or v_offer_end > now()) then v_disc
    else 0
  end;

  v_final := round((p_price * (100 - v_active_disc)) / 100.0);

  update public.menu_items
  set
    price = round(p_price, 2),
    discount_percent = v_disc,
    offer_ends_at = v_offer_end,
    updated_at = now()
  where public.menu_items.id = p_item_id;

  if not found then
    raise exception 'খাবারটি পাওয়া যায়নি: %', p_item_id;
  end if;

  return query
  select
    m.id,
    m.name,
    m.category,
    m.price,
    m.discount_percent,
    m.offer_ends_at,
    v_final as final_price
  from public.menu_items m
  where m.id = p_item_id;
end;
$$;

-- ---------------------------------------------------------
-- 3. CUSTOMER ORDER CREATION (LIVE MENU PRICE + OFFER)
-- ---------------------------------------------------------

create or replace function public.place_customer_order(
  p_items jsonb,
  p_delivery_name text default null,
  p_delivery_phone text default null,
  p_delivery_address text default null,
  p_payment_method text default 'cod',
  p_payment_status text default 'unpaid',
  p_payment_reference text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_order_id uuid;
  v_total numeric(12,2) := 0;
  v_item jsonb;
  v_item_id text;
  v_qty integer;
  v_name text;
  v_base_price numeric(12,2);
  v_disc numeric(5,2);
  v_offer_end timestamptz;
  v_active_disc numeric(5,2);
  v_price numeric(12,2);

  v_profile_name text;
  v_user_email text;
  v_profile_phone text;
  v_profile_address text;

  v_final_name text;
  v_final_phone text;
  v_final_address text;
  v_final_pay_method text;
  v_final_pay_status text;
begin
  if auth.uid() is null then
    raise exception 'লগইন করে অর্ডার করুন';
  end if;

  if public.is_admin() then
    raise exception 'কাস্টমার অ্যাকাউন্ট দিয়ে অর্ডার করুন';
  end if;

  if exists (select 1 from public.store_settings where id = 1 and is_online = false) then
    raise exception 'ক্যাফে/রেস্টুরেন্ট এখন বন্ধ আছে';
  end if;

  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'অর্ডারে খাবার যোগ করুন';
  end if;

  select
    coalesce(p.full_name, ''),
    coalesce(nullif(p.email, ''), u.email, ''),
    coalesce(p.phone, ''),
    coalesce(p.address, '')
  into v_profile_name, v_user_email, v_profile_phone, v_profile_address
  from public.profiles p
  left join auth.users u on u.id = p.id
  where p.id = auth.uid();

  v_final_name := coalesce(nullif(trim(coalesce(p_delivery_name, '')), ''), v_profile_name);
  v_final_phone := coalesce(nullif(trim(coalesce(p_delivery_phone, '')), ''), v_profile_phone);
  v_final_address := coalesce(nullif(trim(coalesce(p_delivery_address, '')), ''), v_profile_address);

  if v_final_name = '' or v_final_phone = '' or v_final_address = '' then
    raise exception 'ডেলিভারির নাম, মোবাইল নম্বর এবং ঠিকানা দিন';
  end if;

  v_final_pay_method := case
    when p_payment_method in ('cod', 'online_qr') then p_payment_method
    else 'cod'
  end;

  v_final_pay_status := case
    when v_final_pay_method = 'online_qr' then 'pending_verification'
    else 'unpaid'
  end;

  insert into public.orders (
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    customer_address,
    total_amount,
    status,
    approval_status,
    sale_type,
    payment_method,
    payment_status,
    payment_reference
  )
  values (
    auth.uid(),
    v_final_name,
    v_user_email,
    v_final_phone,
    v_final_address,
    0,
    'pending',
    'not_required',
    'online',
    v_final_pay_method,
    v_final_pay_status,
    coalesce(trim(p_payment_reference), '')
  )
  returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_item_id := v_item->>'id';
    v_qty := (v_item->>'quantity')::integer;

    if v_qty is null or v_qty < 1 or v_qty > 100 then
      raise exception 'খাবারের পরিমাণ সঠিক নয়';
    end if;

    select
      m.name,
      m.price,
      coalesce(m.discount_percent, 0),
      m.offer_ends_at
    into v_name, v_base_price, v_disc, v_offer_end
    from public.menu_items m
    where m.id = v_item_id;

    if v_name is null then
      raise exception 'অজানা খাবার: %', v_item_id;
    end if;

    v_active_disc := case
      when v_disc > 0 and (v_offer_end is null or v_offer_end > now()) then v_disc
      else 0
    end;

    v_price := round((v_base_price * (100 - v_active_disc)) / 100.0);

    insert into public.order_items (
      order_id,
      item_id,
      item_name,
      unit_price,
      quantity,
      line_total,
      item_status
    )
    values (
      v_order_id,
      v_item_id,
      v_name,
      v_price,
      v_qty,
      v_price * v_qty,
      'active'
    );

    v_total := v_total + (v_price * v_qty);
  end loop;

  update public.orders
  set total_amount = v_total
  where id = v_order_id;

  return v_order_id;
end;
$$;

-- ---------------------------------------------------------
-- 4. ADMIN VERIFY ONLINE PAYMENT AS PAID
-- ---------------------------------------------------------

create or replace function public.admin_mark_payment_paid(
  p_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'শুধু অ্যাডমিন পেমেন্ট ভেরিফাই করতে পারবেন';
  end if;

  update public.orders
  set payment_status = 'paid',
      updated_at = now()
  where id = p_order_id
    and sale_type = 'online';

  if not found then
    raise exception 'অর্ডারটি পাওয়া যায়নি';
  end if;
end;
$$;

-- ---------------------------------------------------------
-- 5. ADMIN UPDATE ORDER STATUS AND TIMERS
-- ---------------------------------------------------------

create or replace function public.admin_update_order_status(
  p_order_id uuid,
  p_status text,
  p_preparation_minutes integer default null,
  p_delivery_minutes integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'শুধু অ্যাডমিন এই কাজ করতে পারবেন';
  end if;

  if p_status not in (
    'confirmed',
    'preparing',
    'out_for_delivery',
    'completed',
    'cancelled'
  ) then
    raise exception 'অবৈধ অর্ডার স্ট্যাটাস';
  end if;

  if p_status = 'confirmed' then
    if p_preparation_minutes is null
       or p_preparation_minutes < 1
       or p_preparation_minutes > 180 then
      raise exception 'প্রস্তুতির সময় ১ থেকে ১৮০ মিনিট দিন';
    end if;

    update public.orders
    set
      status = 'confirmed',
      preparation_minutes = p_preparation_minutes,
      preparation_started_at = now(),
      preparation_ends_at =
        now() + make_interval(mins => p_preparation_minutes),
      updated_at = now()
    where id = p_order_id
      and status = 'pending'
      and approval_status in ('not_required', 'accepted');

  elsif p_status = 'preparing' then

    update public.orders
    set status = 'preparing',
        updated_at = now()
    where id = p_order_id
      and status = 'confirmed';

  elsif p_status = 'out_for_delivery' then

    if p_delivery_minutes is null
       or p_delivery_minutes < 1
       or p_delivery_minutes > 180 then
      raise exception 'ডেলিভারির সময় ১ থেকে ১৮০ মিনিট দিন';
    end if;

    update public.orders
    set
      status = 'out_for_delivery',
      delivery_minutes = p_delivery_minutes,
      delivery_started_at = now(),
      delivery_ends_at =
        now() + make_interval(mins => p_delivery_minutes),
      updated_at = now()
    where id = p_order_id
      and status in ('confirmed', 'preparing');

  elsif p_status = 'completed' then

    update public.orders
    set status = 'completed',
        payment_status = 'paid',
        completed_at = coalesce(completed_at, now()),
        updated_at = now()
    where id = p_order_id
      and status = 'out_for_delivery';

  elsif p_status = 'cancelled' then

    update public.orders
    set status = 'cancelled',
        updated_at = now()
    where id = p_order_id
      and status = 'pending';
  end if;

  if not found then
    raise exception 'অর্ডারটি পাওয়া যায়নি অথবা এই পরিবর্তন অনুমোদিত নয়';
  end if;
end;
$$;

-- ---------------------------------------------------------
-- 6. CUSTOMER ACCEPT OR REJECT CHANGED ORDER
-- ---------------------------------------------------------

create or replace function public.customer_respond_to_order_change(
  p_order_id uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    raise exception 'কাস্টমার অ্যাকাউন্ট প্রয়োজন';
  end if;

  if p_accept then
    update public.orders
    set approval_status = 'accepted',
        updated_at = now()
    where id = p_order_id
      and customer_id = auth.uid()
      and approval_status = 'awaiting_customer'
      and status = 'pending';

  else
    update public.orders
    set approval_status = 'rejected',
        status = 'cancelled',
        updated_at = now()
    where id = p_order_id
      and customer_id = auth.uid()
      and approval_status = 'awaiting_customer'
      and status = 'pending';
  end if;

  if not found then
    raise exception 'এই অর্ডারে অনুমতি দেওয়া যাচ্ছে না';
  end if;
end;
$$;

-- ---------------------------------------------------------
-- 7. OFFLINE SALE (LIVE MENU PRICE + OFFER, PAID)
-- ---------------------------------------------------------

create or replace function public.admin_create_offline_sale(
  p_items jsonb,
  p_payment_method text default 'cod'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_total numeric(12,2) := 0;
  v_item jsonb;
  v_item_id text;
  v_qty integer;
  v_name text;
  v_base_price numeric(12,2);
  v_disc numeric(5,2);
  v_offer_end timestamptz;
  v_active_disc numeric(5,2);
  v_price numeric(12,2);
  v_pay_method text;
begin
  if not public.is_admin() then
    raise exception 'শুধু অ্যাডমিন অফলাইন বিক্রি করতে পারবেন';
  end if;

  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'বিক্রির জন্য খাবার যোগ করুন';
  end if;

  v_pay_method := case
    when p_payment_method in ('cod', 'online_qr') then p_payment_method
    else 'cod'
  end;

  insert into public.orders (
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    customer_address,
    total_amount,
    status,
    approval_status,
    sale_type,
    payment_method,
    payment_status,
    completed_at
  )
  values (
    auth.uid(),
    'অফলাইন বিক্রি',
    '',
    '',
    '',
    0,
    'completed',
    'not_required',
    'offline',
    v_pay_method,
    'paid',
    now()
  )
  returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_item_id := v_item->>'id';
    v_qty := (v_item->>'quantity')::integer;

    if v_qty is null or v_qty < 1 or v_qty > 100 then
      raise exception 'পরিমাণ সঠিক নয়';
    end if;

    select
      m.name,
      m.price,
      coalesce(m.discount_percent, 0),
      m.offer_ends_at
    into v_name, v_base_price, v_disc, v_offer_end
    from public.menu_items m
    where m.id = v_item_id;

    if v_name is null then
      raise exception 'অজানা খাবার: %', v_item_id;
    end if;

    v_active_disc := case
      when v_disc > 0 and (v_offer_end is null or v_offer_end > now()) then v_disc
      else 0
    end;

    v_price := round((v_base_price * (100 - v_active_disc)) / 100.0);

    insert into public.order_items (
      order_id,
      item_id,
      item_name,
      unit_price,
      quantity,
      line_total,
      item_status
    )
    values (
      v_order_id,
      v_item_id,
      v_name,
      v_price,
      v_qty,
      v_price * v_qty,
      'active'
    );

    v_total := v_total + (v_price * v_qty);
  end loop;

  update public.orders
  set total_amount = v_total
  where id = v_order_id;

  return v_order_id;
end;
$$;

-- ---------------------------------------------------------
-- 8. FUNCTION PERMISSIONS
-- ---------------------------------------------------------

grant execute on function public.admin_update_menu_item(
  text, numeric, numeric, numeric
) to authenticated;

grant execute on function public.place_customer_order(
  jsonb, text, text, text, text, text, text
) to authenticated;

grant execute on function public.admin_mark_payment_paid(
  uuid
) to authenticated;

grant execute on function public.admin_update_order_status(
  uuid, text, integer, integer
) to authenticated;

grant execute on function public.customer_respond_to_order_change(
  uuid, boolean
) to authenticated;

grant execute on function public.admin_create_offline_sale(jsonb, text)
  to authenticated;

commit;

notify pgrst, 'reload schema';
