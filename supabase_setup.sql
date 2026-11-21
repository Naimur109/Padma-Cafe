
-- ============================================================
-- PADMA CAFE
-- COMPLETE SUPABASE DATABASE SETUP
-- Currency: BDT (৳)
-- Business timezone: Asia/Dhaka
-- Menu: 26 items
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL DEFAULT '',
    phone text NOT NULL DEFAULT '',
    address text NOT NULL DEFAULT '',
    role text NOT NULL DEFAULT 'customer'
        CHECK (role IN ('customer', 'admin')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create a customer profile automatically after signup.

CREATE OR REPLACE FUNCTION public.handle_new_padma_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        phone,
        address,
        role
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'address', ''),
        'customer'
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_padma_auth_user_created
ON auth.users;

CREATE TRIGGER on_padma_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_padma_user();


-- ============================================================
-- 2. ADMIN CHECK
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    );
$$;


-- Prevent a customer from changing their own role.

CREATE OR REPLACE FUNCTION public.protect_padma_profile_role()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role
       AND auth.uid() IS NOT NULL THEN
        RAISE EXCEPTION 'Only a trusted database administrator can change account roles.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_padma_profile_role_trigger
ON public.profiles;

CREATE TRIGGER protect_padma_profile_role_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_padma_profile_role();


-- ============================================================
-- 3. MENU PRICES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.menu_prices (
    item_id text PRIMARY KEY,
    item_name text NOT NULL,
    category text NOT NULL,
    unit_price numeric(12,2) NOT NULL
        CHECK (unit_price >= 0),
    active boolean NOT NULL DEFAULT true,
    updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.menu_prices
(item_id, item_name, category, unit_price)
VALUES

-- PADMA SPECIAL: 11

('hot_coffee', 'হট কফি', 'পদ্মা স্পেশাল', 50),
('malai_cha', 'মালাই চা', 'পদ্মা স্পেশাল', 40),
('dudh_cha', 'দুধ চা', 'পদ্মা স্পেশাল', 30),
('pora_roti_10', 'পোড়া রুটি', 'পদ্মা স্পেশাল', 10),
('pora_roti_15', 'পোড়া রুটি', 'পদ্মা স্পেশাল', 15),
('malai_cha_roti', 'মালাই চা + পোড়া রুটি', 'পদ্মা স্পেশাল', 50),
('chotpoti', 'চটপটি', 'পদ্মা স্পেশাল', 40),
('chotpoti_egg', 'চটপটি (ডিম)', 'পদ্মা স্পেশাল', 60),
('fuchka', 'ফুচকা', 'পদ্মা স্পেশাল', 50),
('doi_fuchka', 'দই ফুচকা', 'পদ্মা স্পেশাল', 90),
('doi_chira', 'দই চিড়া', 'পদ্মা স্পেশাল', 80),

-- BURGER: 2

('chicken_tikka_burger', 'চিকেন টিক্কা বার্গার', 'বার্গার', 80),
('beef_burger', 'বিফ বার্গার', 'বার্গার', 130),

-- STARTER: 5

('kolija_singara', 'কলিজা সিঙ্গারা', 'স্টাটার', 25),
('french_fries', 'ফ্রেন্স ফ্রাই', 'স্টাটার', 50),
('chicken_spring_roll', 'চিকেন স্প্রিং রোল', 'স্টাটার', 80),
('chicken_momos', 'চিকেন মমস', 'স্টাটার', 100),
('chicken_fry_3pcs', 'চিকেন ফ্রাই (৩ পিস)', 'স্টাটার', 120),

-- SHAKES: 6

('cold_coffee', 'কোল্ড কফি', 'শেক', 80),
('chocolate_shake', 'চকলেট শেক', 'শেক', 90),
('vanilla_shake', 'ভ্যানিলা শেক', 'শেক', 99),
('oreo_shake', 'অরিও শেক', 'শেক', 110),
('kitkat_shake', 'কিটক্যাট শেক', 'শেক', 110),
('butterscotch_shake', 'বাটারস্কচ শেক (Padma Special)', 'শেক', 110),

-- SOFT DRINKS: 2

('water', 'পানি', 'সফট ড্রিঙ্কস', 20),
('mojo', 'মজো', 'সফট ড্রিঙ্কস', 20)

ON CONFLICT (item_id)
DO UPDATE SET
    item_name = EXCLUDED.item_name,
    category = EXCLUDED.category,
    unit_price = EXCLUDED.unit_price,
    active = true,
    updated_at = now();


-- ============================================================
-- 4. ONLINE ORDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_id uuid NOT NULL
        REFERENCES auth.users(id) ON DELETE RESTRICT,

    customer_name text NOT NULL DEFAULT '',
    customer_email text NOT NULL DEFAULT '',
    customer_phone text NOT NULL DEFAULT '',
    customer_address text NOT NULL DEFAULT '',

    total_amount numeric(12,2) NOT NULL DEFAULT 0
        CHECK (total_amount >= 0),

    status text NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'confirmed',
                'preparing',
                'completed',
                'cancelled'
            )
        ),

    approval_status text NOT NULL DEFAULT 'not_required'
        CHECK (
            approval_status IN (
                'not_required',
                'awaiting_customer',
                'accepted',
                'rejected'
            )
        ),

    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 5. ONLINE ORDER ITEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id uuid NOT NULL
        REFERENCES public.orders(id) ON DELETE CASCADE,

    item_id text NOT NULL,
    item_name text NOT NULL,

    unit_price numeric(12,2) NOT NULL
        CHECK (unit_price >= 0),

    quantity integer NOT NULL
        CHECK (quantity BETWEEN 1 AND 500),

    line_total numeric(12,2) NOT NULL
        CHECK (line_total >= 0),

    item_status text NOT NULL DEFAULT 'active'
        CHECK (item_status IN ('active', 'unavailable')),

    created_at timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 6. RECALCULATE ONLINE ORDER TOTAL
-- ============================================================

CREATE OR REPLACE FUNCTION public.recalculate_padma_order_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id uuid;
    v_total numeric(12,2);
BEGIN
    v_order_id := COALESCE(NEW.order_id, OLD.order_id);

    SELECT COALESCE(SUM(line_total), 0)
    INTO v_total
    FROM public.order_items
    WHERE order_id = v_order_id
      AND item_status = 'active';

    UPDATE public.orders
    SET total_amount = v_total,
        updated_at = now()
    WHERE id = v_order_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS recalculate_padma_order_total_trigger
ON public.order_items;

CREATE TRIGGER recalculate_padma_order_total_trigger
AFTER INSERT OR UPDATE OR DELETE
ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_padma_order_total();


-- ============================================================
-- 7. OFFLINE SALES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.offline_sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    receipt_no text NOT NULL UNIQUE,

    total_amount numeric(12,2) NOT NULL DEFAULT 0
        CHECK (total_amount >= 0),

    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.offline_sale_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    offline_sale_id uuid NOT NULL
        REFERENCES public.offline_sales(id) ON DELETE CASCADE,

    item_id text NOT NULL,
    item_name text NOT NULL,

    unit_price numeric(12,2) NOT NULL
        CHECK (unit_price >= 0),

    quantity integer NOT NULL
        CHECK (quantity BETWEEN 1 AND 500),

    line_total numeric(12,2) NOT NULL
        CHECK (line_total >= 0),

    created_at timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 8. PLACE CUSTOMER ORDER
-- Prices are always read from the database.
-- ============================================================

CREATE OR REPLACE FUNCTION public.place_customer_order(
    p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user uuid;
    v_profile public.profiles%ROWTYPE;
    v_order_id uuid;
    v_item jsonb;
    v_item_id text;
    v_quantity integer;
    v_price numeric(12,2);
    v_name text;
BEGIN
    v_user := auth.uid();

    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Please login first.';
    END IF;

    IF public.is_admin() THEN
        RAISE EXCEPTION 'Customer account required.';
    END IF;

    IF jsonb_typeof(p_items) <> 'array'
       OR jsonb_array_length(p_items) < 1
       OR jsonb_array_length(p_items) > 26 THEN
        RAISE EXCEPTION 'Invalid order items.';
    END IF;

    SELECT *
    INTO v_profile
    FROM public.profiles
    WHERE id = v_user;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Customer profile not found.';
    END IF;

    IF trim(v_profile.full_name) = ''
       OR trim(v_profile.phone) = ''
       OR trim(v_profile.address) = '' THEN
        RAISE EXCEPTION 'Please complete your customer profile.';
    END IF;

    INSERT INTO public.orders (
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        customer_address,
        total_amount,
        status,
        approval_status
    )
    VALUES (
        v_user,
        v_profile.full_name,
        COALESCE(
            (SELECT email FROM auth.users WHERE id = v_user),
            ''
        ),
        v_profile.phone,
        v_profile.address,
        0,
        'pending',
        'not_required'
    )
    RETURNING id INTO v_order_id;

    FOR v_item IN
        SELECT value FROM jsonb_array_elements(p_items)
    LOOP
        v_item_id := v_item->>'id';

        IF v_item_id IS NULL THEN
            RAISE EXCEPTION 'Invalid menu item.';
        END IF;

        IF (v_item->>'quantity') !~ '^[0-9]+$' THEN
            RAISE EXCEPTION 'Invalid item quantity.';
        END IF;

        v_quantity := (v_item->>'quantity')::integer;

        IF v_quantity < 1 OR v_quantity > 500 THEN
            RAISE EXCEPTION 'Invalid item quantity.';
        END IF;

        SELECT item_name, unit_price
        INTO v_name, v_price
        FROM public.menu_prices
        WHERE item_id = v_item_id
          AND active = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Menu item is unavailable: %', v_item_id;
        END IF;

        INSERT INTO public.order_items (
            order_id,
            item_id,
            item_name,
            unit_price,
            quantity,
            line_total,
            item_status
        )
        VALUES (
            v_order_id,
            v_item_id,
            v_name,
            v_price,
            v_quantity,
            v_price * v_quantity,
            'active'
        );
    END LOOP;

    RETURN jsonb_build_object(
        'id', v_order_id,
        'message', 'Order placed successfully'
    );
END;
$$;


-- ============================================================
-- 9. ADMIN UPDATE ORDER STATUS
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_update_order_status(
    p_order_id uuid,
    p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old_status text;
    v_approval text;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin permission required.';
    END IF;

    IF p_status NOT IN (
        'confirmed',
        'preparing',
        'completed',
        'cancelled'
    ) THEN
        RAISE EXCEPTION 'Invalid order status.';
    END IF;

    SELECT status, approval_status
    INTO v_old_status, v_approval
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found.';
    END IF;

    IF v_approval = 'awaiting_customer' THEN
        RAISE EXCEPTION 'Waiting for customer approval.';
    END IF;

    IF v_old_status IN ('completed', 'cancelled') THEN
        RAISE EXCEPTION 'This order is already closed.';
    END IF;

    IF p_status = 'confirmed'
       AND v_old_status <> 'pending' THEN
        RAISE EXCEPTION 'Invalid status transition.';
    END IF;

    IF p_status = 'preparing'
       AND v_old_status <> 'confirmed' THEN
        RAISE EXCEPTION 'Invalid status transition.';
    END IF;

    IF p_status = 'completed'
       AND v_old_status <> 'preparing' THEN
        RAISE EXCEPTION 'Invalid status transition.';
    END IF;

    IF p_status = 'cancelled'
       AND v_old_status <> 'pending' THEN
        RAISE EXCEPTION 'Only pending orders can be cancelled here.';
    END IF;

    UPDATE public.orders
    SET status = p_status,
        completed_at = CASE
            WHEN p_status = 'completed' THEN now()
            ELSE completed_at
        END,
        updated_at = now()
    WHERE id = p_order_id;
END;
$$;


-- ============================================================
-- 10. ADMIN MARK ITEM UNAVAILABLE
-- Customer approval is required before proceeding.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_mark_item_unavailable(
    p_item_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id uuid;
    v_status text;
    v_approval text;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin permission required.';
    END IF;

    SELECT oi.order_id, o.status, o.approval_status
    INTO v_order_id, v_status, v_approval
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = p_item_id
    FOR UPDATE OF oi, o;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order item not found.';
    END IF;

    IF v_status <> 'pending' THEN
        RAISE EXCEPTION 'Only pending orders can be changed.';
    END IF;

    IF v_approval = 'awaiting_customer' THEN
        RAISE EXCEPTION 'This order is already awaiting approval.';
    END IF;

    UPDATE public.order_items
    SET item_status = 'unavailable'
    WHERE id = p_item_id;

    UPDATE public.orders
    SET approval_status = 'awaiting_customer',
        updated_at = now()
    WHERE id = v_order_id;
END;
$$;


-- ============================================================
-- 11. CUSTOMER APPROVES REMAINING ITEMS
-- ============================================================

CREATE OR REPLACE FUNCTION public.customer_approve_remaining_order(
    p_order_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_customer_id uuid;
    v_approval text;
    v_active_count integer;
BEGIN
    SELECT customer_id, approval_status
    INTO v_customer_id, v_approval
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found.';
    END IF;

    IF v_customer_id <> auth.uid() THEN
        RAISE EXCEPTION 'This order does not belong to you.';
    END IF;

    IF v_approval <> 'awaiting_customer' THEN
        RAISE EXCEPTION 'Customer approval is not pending.';
    END IF;

    SELECT COUNT(*)
    INTO v_active_count
    FROM public.order_items
    WHERE order_id = p_order_id
      AND item_status = 'active';

    IF v_active_count = 0 THEN
        RAISE EXCEPTION 'No available items remain.';
    END IF;

    UPDATE public.orders
    SET approval_status = 'accepted',
        status = 'pending',
        updated_at = now()
    WHERE id = p_order_id;
END;
$$;


-- ============================================================
-- 12. CUSTOMER CANCELS WHOLE CHANGED ORDER
-- ============================================================

CREATE OR REPLACE FUNCTION public.customer_cancel_changed_order(
    p_order_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_customer_id uuid;
    v_approval text;
BEGIN
    SELECT customer_id, approval_status
    INTO v_customer_id, v_approval
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found.';
    END IF;

    IF v_customer_id <> auth.uid() THEN
        RAISE EXCEPTION 'This order does not belong to you.';
    END IF;

    IF v_approval <> 'awaiting_customer' THEN
        RAISE EXCEPTION 'Customer approval is not pending.';
    END IF;

    UPDATE public.orders
    SET status = 'cancelled',
        approval_status = 'rejected',
        updated_at = now()
    WHERE id = p_order_id;
END;
$$;


-- ============================================================
-- 13. CREATE OFFLINE SALE
-- No customer details are collected.
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_offline_sale(
    p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sale_id uuid;
    v_item jsonb;
    v_item_id text;
    v_quantity integer;
    v_price numeric(12,2);
    v_name text;
    v_total numeric(12,2) := 0;
    v_receipt text;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin permission required.';
    END IF;

    IF jsonb_typeof(p_items) <> 'array'
       OR jsonb_array_length(p_items) < 1
       OR jsonb_array_length(p_items) > 26 THEN
        RAISE EXCEPTION 'Invalid sale items.';
    END IF;

    v_sale_id := gen_random_uuid();

    v_receipt :=
        'PC-' ||
        to_char(now() AT TIME ZONE 'Asia/Dhaka', 'YYYYMMDD-HH24MISS') ||
        '-' ||
        upper(substr(replace(v_sale_id::text, '-', ''), 1, 6));

    INSERT INTO public.offline_sales (
        id,
        receipt_no,
        total_amount,
        created_by
    )
    VALUES (
        v_sale_id,
        v_receipt,
        0,
        auth.uid()
    );

    FOR v_item IN
        SELECT value FROM jsonb_array_elements(p_items)
    LOOP
        v_item_id := v_item->>'id';

        IF v_item_id IS NULL
           OR (v_item->>'quantity') !~ '^[0-9]+$' THEN
            RAISE EXCEPTION 'Invalid sale item.';
        END IF;

        v_quantity := (v_item->>'quantity')::integer;

        IF v_quantity < 1 OR v_quantity > 500 THEN
            RAISE EXCEPTION 'Invalid sale quantity.';
        END IF;

        SELECT item_name, unit_price
        INTO v_name, v_price
        FROM public.menu_prices
        WHERE item_id = v_item_id
          AND active = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Menu item unavailable.';
        END IF;

        INSERT INTO public.offline_sale_items (
            offline_sale_id,
            item_id,
            item_name,
            unit_price,
            quantity,
            line_total
        )
        VALUES (
            v_sale_id,
            v_item_id,
            v_name,
            v_price,
            v_quantity,
            v_price * v_quantity
        );

        v_total := v_total + (v_price * v_quantity);
    END LOOP;

    UPDATE public.offline_sales
    SET total_amount = v_total
    WHERE id = v_sale_id;

    RETURN v_sale_id;
END;
$$;


-- ============================================================
-- 14. UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_padma_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at
ON public.profiles;

CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_padma_updated_at();

DROP TRIGGER IF EXISTS orders_updated_at
ON public.orders;

CREATE TRIGGER orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_padma_updated_at();


-- ============================================================
-- 15. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_sale_items ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 16. REMOVE OLD POLICIES WITH THESE NAMES
-- ============================================================

DROP POLICY IF EXISTS "padma_profiles_select"
ON public.profiles;

DROP POLICY IF EXISTS "padma_profiles_update"
ON public.profiles;

DROP POLICY IF EXISTS "padma_menu_read"
ON public.menu_prices;

DROP POLICY IF EXISTS "padma_orders_select"
ON public.orders;

DROP POLICY IF EXISTS "padma_items_select"
ON public.order_items;

DROP POLICY IF EXISTS "padma_offline_sales_select"
ON public.offline_sales;

DROP POLICY IF EXISTS "padma_offline_items_select"
ON public.offline_sale_items;


-- ============================================================
-- 17. PROFILES POLICIES
-- ============================================================

CREATE POLICY "padma_profiles_select"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    id = auth.uid()
    OR public.is_admin()
);

CREATE POLICY "padma_profiles_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());


-- ============================================================
-- 18. MENU POLICIES
-- ============================================================

CREATE POLICY "padma_menu_read"
ON public.menu_prices
FOR SELECT
TO anon, authenticated
USING (active = true);


-- ============================================================
-- 19. ONLINE ORDER POLICIES
-- ============================================================

CREATE POLICY "padma_orders_select"
ON public.orders
FOR SELECT
TO authenticated
USING (
    customer_id = auth.uid()
    OR public.is_admin()
);


-- ============================================================
-- 20. ORDER ITEM POLICIES
-- ============================================================

CREATE POLICY "padma_items_select"
ON public.order_items
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.id = order_id
          AND (
              o.customer_id = auth.uid()
              OR public.is_admin()
          )
    )
);


-- ============================================================
-- 21. OFFLINE SALE POLICIES
-- ============================================================

CREATE POLICY "padma_offline_sales_select"
ON public.offline_sales
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "padma_offline_items_select"
ON public.offline_sale_items
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.offline_sales s
        WHERE s.id = offline_sale_id
          AND public.is_admin()
    )
);


-- ============================================================
-- 22. GRANTS
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.menu_prices TO anon, authenticated;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;

GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;

GRANT SELECT ON public.offline_sales TO authenticated;
GRANT SELECT ON public.offline_sale_items TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

GRANT EXECUTE ON FUNCTION public.place_customer_order(jsonb)
TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_update_order_status(uuid, text)
TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_mark_item_unavailable(uuid)
TO authenticated;

GRANT EXECUTE ON FUNCTION public.customer_approve_remaining_order(uuid)
TO authenticated;

GRANT EXECUTE ON FUNCTION public.customer_cancel_changed_order(uuid)
TO authenticated;

GRANT EXECUTE ON FUNCTION public.create_offline_sale(jsonb)
TO authenticated;


-- ============================================================
-- 23. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_padma_orders_customer
ON public.orders(customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_padma_orders_status
ON public.orders(status, completed_at);

CREATE INDEX IF NOT EXISTS idx_padma_order_items_order
ON public.order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_padma_offline_sales_date
ON public.offline_sales(created_at);

CREATE INDEX IF NOT EXISTS idx_padma_offline_items_sale
ON public.offline_sale_items(offline_sale_id);


-- ============================================================
-- 24. ENABLE REALTIME
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime
        ADD TABLE public.orders;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'order_items'
    ) THEN
        ALTER PUBLICATION supabase_realtime
        ADD TABLE public.order_items;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'offline_sales'
    ) THEN
        ALTER PUBLICATION supabase_realtime
        ADD TABLE public.offline_sales;
    END IF;
END;
$$;


-- ============================================================
-- 25. SETUP COMPLETE
-- ============================================================

SELECT
    'Padma Cafe database setup completed' AS message,
    (SELECT COUNT(*) FROM public.menu_prices WHERE active = true)
        AS active_menu_items;
