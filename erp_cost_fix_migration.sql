-- ============================================================================
-- MIGRACIÓN: Sistema de Costos y Compras ERP Extendidas
-- OBJETIVO: Soportar la compra de PT, cálculo de márgenes y tablas faltantes.
-- ============================================================================

-- 1. Actualizar tabla de productos con campos de estrategia de precios
ALTER TABLE finanzas_business_products ADD COLUMN IF NOT EXISTS markup_percentage DECIMAL DEFAULT 0;
ALTER TABLE finanzas_business_products ADD COLUMN IF NOT EXISTS average_cost DECIMAL DEFAULT 0;
ALTER TABLE finanzas_business_products ADD COLUMN IF NOT EXISTS base_price DECIMAL DEFAULT 0;

-- 2. Asegurar existencia de tablas de ERP si no se crearon anteriormente
CREATE TABLE IF NOT EXISTS finanzas_biz_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    category TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS finanzas_biz_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES finanzas_biz_suppliers(id) ON DELETE SET NULL,
    total_amount DECIMAL DEFAULT 0,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'received',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS finanzas_biz_purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    purchase_id UUID REFERENCES finanzas_biz_purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES finanzas_business_products(id) ON DELETE CASCADE,
    quantity DECIMAL NOT NULL,
    unit_cost DECIMAL NOT NULL,
    total_cost DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS finanzas_biz_inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES finanzas_business_products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL, -- 'COMPRA', 'VENTA', 'PRODUCCION_ENTRADA', 'PRODUCCION_SALIDA', 'AJUSTE'
    quantity DECIMAL NOT NULL,
    stock_before DECIMAL NOT NULL,
    stock_after DECIMAL NOT NULL,
    unit_cost DECIMAL,
    reference_id UUID,
    reference_type TEXT,
    notes TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security) para las nuevas tablas
ALTER TABLE finanzas_biz_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas_biz_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas_biz_purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas_biz_inventory_movements ENABLE ROW LEVEL SECURITY;

-- Crear políticas básicas de acceso por usuario
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own suppliers') THEN
        CREATE POLICY "Users can manage their own suppliers" ON finanzas_biz_suppliers FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own purchases') THEN
        CREATE POLICY "Users can manage their own purchases" ON finanzas_biz_purchases FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own purchase items') THEN
        CREATE POLICY "Users can manage their own purchase items" ON finanzas_biz_purchase_items FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own movements') THEN
        CREATE POLICY "Users can manage their own movements" ON finanzas_biz_inventory_movements FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;
