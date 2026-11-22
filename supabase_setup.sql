-- =========================================================
-- PADMA CAFE - ADDITIVE DATABASE MIGRATION
-- Existing tables and data will be preserved.
-- Timezone: Asia/Dhaka | Currency: BDT
-- =========================================================

begin;

drop function if exists public.place_customer_order(jsonb);

-- ---------------------------------------------------------
-- 1. ADD NEW ORDER & PROFILE COLUMNS & CONSTRAINTS
-- ---------------------------------------------------------

alter table public.orders
  add column if not exists sale_type text not null default 'online',
  add column if not exists preparation_minutes integer,
  add column if not exists preparation_started_at timestamptz,
  add column if not exists preparation_ends_at timestamptz,
  add column if not exists delivery_minutes integer,
  add column if not exists delivery_started_at timestamptz,
  add column if not exists delivery_ends_at timestamptz,
  add column if not exists completed_at timestamptz;

alter table public.profiles
  add column if not exists avatar_url text default '';

create table if not exists public.store_settings (
  id integer primary key default 1,
  is_online boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id, is_online)
values (1, true)
on conflict (id) do nothing;

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

-- ---------------------------------------------------------
-- 2. CUSTOMER ORDER CREATION
-- ---------------------------------------------------------

create or replace function public.place_customer_order(
  p_items jsonb
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
  v_price numeric(12,2);

  v_prices jsonb := '[
    {"id":"hot_coffee","name":"হট কফি","price":50},
    {"id":"malai_cha","name":"মালাই চা","price":40},
    {"id":"dudh_cha","name":"দুধ চা","price":30},
    {"id":"pora_roti_10","name":"পোড়া রুটি","price":10},
    {"id":"pora_roti_15","name":"পোড়া রুটি","price":15},
    {"id":"malai_cha_roti","name":"মালাই চা + পোড়া রুটি","price":50},
    {"id":"chotpoti","name":"চটপটি","price":40},
    {"id":"chotpoti_egg","name":"চটপটি (ডিম)","price":60},
    {"id":"fuchka","name":"ফুচকা","price":50},
    {"id":"doi_fuchka","name":"দই ফুচকা","price":90},
    {"id":"doi_chira","name":"দই চিড়া","price":80},
    {"id":"chicken_tikka_burger","name":"চিকেন টিক্কা বার্গার","price":80},
    {"id":"beef_burger","name":"বিফ বার্গার","price":130},
    {"id":"kolija_singara","name":"কলিজা সিঙ্গারা","price":25},
    {"id":"french_fries","name":"ফ্রেন্স ফ্রাই","price":50},
    {"id":"chicken_spring_roll","name":"চিকেন স্প্রিং রোল","price":80},
    {"id":"chicken_momos","name":"চিকেন মমস","price":100},
    {"id":"chicken_fry_3pcs","name":"চিকেন ফ্রাই (৩ পিস)","price":120},
    {"id":"cold_coffee","name":"কোল্ড কফি","price":80},
    {"id":"chocolate_shake","name":"চকলেট শেক","price":90},
    {"id":"vanilla_shake","name":"ভ্যানিলা শেক","price":99},
    {"id":"oreo_shake","name":"অরিও শেক","price":110},
    {"id":"kitkat_shake","name":"কিটক্যাট শেক","price":110},
    {"id":"butterscotch_shake","name":"বাটারস্কচ শেক (Padma Special)","price":110},
    {"id":"water","name":"পানি","price":20},
    {"id":"mojo","name":"মজো","price":20},
    {"id":"combo_hash_khichuri_regular","name":"হাঁস+খিচুড়ি (রেগুলার)","price":230},
    {"id":"combo_hash_khichuri_special","name":"হাঁস+খিচুড়ি (স্পেশাল)","price":270}
  ]'::jsonb;

  v_user_name text;
  v_phone text;
  v_address text;
begin
  if auth.uid() is null then
    raise exception 'লগইন করে অর্ডার করুন';
  end if;

  if public.is_admin() then
    raise exception 'কাস্টমার অ্যাকাউন্ট দিয়ে অর্ডার করুন';
  end if;

  if exists (select 1 from public.store_settings where id = 1 and is_online = false) then
    raise exception 'ক্যাফে বর্তমানে অফলাইন রয়েছে';
  end if;

  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'অর্ডারে খাবার যোগ করুন';
  end if;

  select
    coalesce(full_name, ''),
    coalesce(phone, ''),
    coalesce(address, '')
  into v_user_name, v_phone, v_address
  from public.profiles
  where id = auth.uid();

  insert into public.orders (
    customer_id,
    customer_name,
    customer_phone,
    customer_address,
    total_amount,
    status,
    approval_status,
    sale_type
  )
  values (
    auth.uid(),
    v_user_name,
    v_phone,
    v_address,
    0,
    'pending',
    'not_required',
    'online'
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
      item->>'name',
      (item->>'price')::numeric
    into v_name, v_price
    from jsonb_array_elements(v_prices) item
    where item->>'id' = v_item_id;

    if v_name is null then
      raise exception 'অজানা খাবার: %', v_item_id;
    end if;

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
-- 3. ADMIN UPDATE ORDER STATUS AND TIMERS
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
-- 4. CUSTOMER ACCEPT OR REJECT CHANGED ORDER
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
-- 5. OFFLINE SALE
-- ---------------------------------------------------------

create or replace function public.admin_create_offline_sale(
  p_items jsonb
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
  v_price numeric(12,2);

  v_prices jsonb := '[
    {"id":"hot_coffee","name":"হট কফি","price":50},
    {"id":"malai_cha","name":"মালাই চা","price":40},
    {"id":"dudh_cha","name":"দুধ চা","price":30},
    {"id":"pora_roti_10","name":"পোড়া রুটি","price":10},
    {"id":"pora_roti_15","name":"পোড়া রুটি","price":15},
    {"id":"malai_cha_roti","name":"মালাই চা + পোড়া রুটি","price":50},
    {"id":"chotpoti","name":"চটপটি","price":40},
    {"id":"chotpoti_egg","name":"চটপটি (ডিম)","price":60},
    {"id":"fuchka","name":"ফুচকা","price":50},
    {"id":"doi_fuchka","name":"দই ফুচকা","price":90},
    {"id":"doi_chira","name":"দই চিড়া","price":80},
    {"id":"chicken_tikka_burger","name":"চিকেন টিক্কা বার্গার","price":80},
    {"id":"beef_burger","name":"বিফ বার্গার","price":130},
    {"id":"kolija_singara","name":"কলিজা সিঙ্গারা","price":25},
    {"id":"french_fries","name":"ফ্রেন্স ফ্রাই","price":50},
    {"id":"chicken_spring_roll","name":"চিকেন স্প্রিং রোল","price":80},
    {"id":"chicken_momos","name":"চিকেন মমস","price":100},
    {"id":"chicken_fry_3pcs","name":"চিকেন ফ্রাই (৩ পিস)","price":120},
    {"id":"cold_coffee","name":"কোল্ড কফি","price":80},
    {"id":"chocolate_shake","name":"চকলেট শেক","price":90},
    {"id":"vanilla_shake","name":"ভ্যানিলা শেক","price":99},
    {"id":"oreo_shake","name":"অরিও শেক","price":110},
    {"id":"kitkat_shake","name":"কিটক্যাট শেক","price":110},
    {"id":"butterscotch_shake","name":"বাটারস্কচ শেক (Padma Special)","price":110},
    {"id":"water","name":"পানি","price":20},
    {"id":"mojo","name":"মজো","price":20},
    {"id":"combo_hash_khichuri_regular","name":"হাঁস+খিচুড়ি (রেগুলার)","price":230},
    {"id":"combo_hash_khichuri_special","name":"হাঁস+খিচুড়ি (স্পেশাল)","price":270}
  ]'::jsonb;
begin
  if not public.is_admin() then
    raise exception 'শুধু অ্যাডমিন অফলাইন বিক্রি করতে পারবেন';
  end if;

  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'বিক্রির জন্য খাবার যোগ করুন';
  end if;

  insert into public.orders (
    customer_id,
    customer_name,
    customer_phone,
    customer_address,
    total_amount,
    status,
    approval_status,
    sale_type,
    completed_at
  )
  values (
    auth.uid(),
    'অফলাইন বিক্রি',
    '',
    '',
    0,
    'completed',
    'not_required',
    'offline',
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
      item->>'name',
      (item->>'price')::numeric
    into v_name, v_price
    from jsonb_array_elements(v_prices) item
    where item->>'id' = v_item_id;

    if v_name is null then
      raise exception 'অজানা খাবার: %', v_item_id;
    end if;

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
-- 6. FUNCTION PERMISSIONS
-- ---------------------------------------------------------

grant execute on function public.place_customer_order(jsonb)
  to authenticated;

grant execute on function public.admin_update_order_status(
  uuid, text, integer, integer
) to authenticated;

grant execute on function public.customer_respond_to_order_change(
  uuid, boolean
) to authenticated;

grant execute on function public.admin_create_offline_sale(jsonb)
  to authenticated;

commit;
