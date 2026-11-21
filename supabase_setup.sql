
-- =====================================================
-- PADMA CAFE - SAFE DATABASE UPDATE
-- Existing customer/order data will be preserved.
-- =====================================================

-- 1. MENU PRICE TABLE
-- Server-side price verification.

CREATE TABLE IF NOT EXISTS public.menu_prices (
    item_id text PRIMARY KEY,
    item_name text NOT NULL,
    unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
    active boolean NOT NULL DEFAULT true,
    updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.menu_prices
(item_id, item_name, unit_price)
VALUES
('malai_cha', 'মালাই চা', 40),
('dudh_cha', 'দুধ চা', 30),
('pora_roti_10', 'পোড়া রুটি (৳১০)', 10),
('pora_roti_15', 'পোড়া রুটি (৳১৫)', 15),
('chotpoti', 'চটপটি', 40),
('chotpoti_egg', 'চটপটি (ডিম)', 60),
('fuchka', 'ফুচকা', 50)
ON CONFLICT (item_id)
DO UPDATE SET
    item_name = EXCLUDED.item_name,
    unit_price = EXCLUDED.unit_price,
    active = true,
    updated_at = now();

ALTER TABLE public.menu_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active menu prices"
ON public.menu_prices;

CREATE POLICY "Public can read active menu prices"
ON public.menu_prices
FOR SELECT
TO anon, authenticated
USING (active = true);

GRANT SELECT ON public.menu_prices TO anon, authenticated;


-- 2. VALIDATE ORDER ITEM PRICE
-- Customers cannot submit fake item prices.

CREATE OR REPLACE FUNCTION public.validate_padma_order_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_price numeric(12,2);
    v_name text;
BEGIN
    IF NOT public.is_admin() THEN
        SELECT unit_price, item_name
        INTO v_price, v_name
        FROM public.menu_prices
        WHERE item_id = NEW.item_id
          AND active = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'এই খাবারটি বর্তমানে পাওয়া যাচ্ছে না';
        END IF;

        NEW.unit_price := v_price;
        NEW.item_name := v_name;
        NEW.line_total := v_price * NEW.quantity;
        NEW.item_status := 'active';
    ELSE
        NEW.line_total := NEW.unit_price * NEW.quantity;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_padma_order_item_trigger
ON public.order_items;

CREATE TRIGGER validate_padma_order_item_trigger
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.validate_padma_order_item();


-- 3. AUTOMATICALLY RECALCULATE ORDER TOTAL
-- Only active items are included.

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


-- 4. PREVENT CUSTOMER FROM SETTING ORDER TOTAL
-- The final total will be calculated from verified items.

CREATE OR REPLACE FUNCTION public.protect_padma_order_total()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NOT public.is_admin() THEN
            NEW.total_amount := 0;
            NEW.status := 'pending';
            NEW.approval_status := 'not_required';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_padma_order_total_trigger
ON public.orders;

CREATE TRIGGER protect_padma_order_total_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.protect_padma_order_total();


-- 5. ENSURE CUSTOMER CANNOT CHANGE ORDER ITEMS
-- Admin item updates remain allowed.

DROP POLICY IF EXISTS "items insert own order"
ON public.order_items;

CREATE POLICY "items insert own order"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.id = order_id
          AND o.customer_id = auth.uid()
          AND o.status = 'pending'
          AND o.approval_status = 'not_required'
    )
);

-- Customers cannot update or delete order items.
-- Existing admin update policy is preserved.


-- 6. PROTECT CUSTOMER PROFILE ROLE
-- A customer cannot promote their own account to admin.

CREATE OR REPLACE FUNCTION public.protect_padma_profile_role()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role
       AND current_user <> 'postgres'
       AND current_user <> 'service_role' THEN
        RAISE EXCEPTION 'Profile role cannot be changed from the website';
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


-- 7. SALES REPORT INDEX

CREATE INDEX IF NOT EXISTS idx_padma_orders_status_created
ON public.orders (status, created_at);

CREATE INDEX IF NOT EXISTS idx_padma_order_items_order
ON public.order_items (order_id, item_status);


-- 8. ENSURE REALTIME TABLES ARE ENABLED

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
END;
$$;


-- =====================================================
-- UPDATE COMPLETE
-- =====================================================
