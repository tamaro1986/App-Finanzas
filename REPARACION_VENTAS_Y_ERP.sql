-- ============================================================================
-- ERP - MIGRACIÓN DE TABLAS DE VENTAS Y REPARACIÓN DE ESQUEMA
-- Ejecutar en el Editor SQL de Supabase
-- ============================================================================

-- 1. ACTUALIZAR PRODUCTOS (Asegurar que existan todos los campos)
ALTER TABLE finanzas_business_products 
    ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'producto_terminado',
    ADD COLUMN IF NOT EXISTS unit_of_measure TEXT DEFAULT 'und',
    ADD COLUMN IF NOT EXISTS markup_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS min_stock_level NUMERIC DEFAULT 5,
    ADD COLUMN IF NOT EXISTS average_cost NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS base_price NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sku TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Alias por si el sync envía 'min_stock' en lugar de 'min_stock_level'
-- (PostgreSQL no soporta alias de columnas en la tabla, pero aseguramos min_stock_level)

-- 2. TABLA DE VENTAS (Encabezado)
CREATE TABLE IF NOT EXISTS finanzas_biz_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES finanzas_biz_suppliers(id) ON DELETE SET NULL, -- Reusamos tabla de contactos
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE DETALLE DE VENTAS
CREATE TABLE IF NOT EXISTS finanzas_biz_sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES finanzas_biz_sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES finanzas_business_products(id) ON DELETE RESTRICT,
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. HABILITAR SEGURIDAD (RLS)
ALTER TABLE finanzas_biz_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas_biz_sale_items ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS RLS (Seguras por usuario)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'erp_sales_policy' AND tablename = 'finanzas_biz_sales') THEN
        CREATE POLICY erp_sales_policy ON finanzas_biz_sales FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'erp_sale_items_policy' AND tablename = 'finanzas_biz_sale_items') THEN
        CREATE POLICY erp_sale_items_policy ON finanzas_biz_sale_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 6. FUNCIÓN HELPER PARA FECHAS
CREATE OR REPLACE FUNCTION update_erp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. TRIGGER PARA updated_at
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_biz_sales_updated_at') THEN
        CREATE TRIGGER trg_biz_sales_updated_at BEFORE UPDATE ON finanzas_biz_sales FOR EACH ROW EXECUTE FUNCTION update_erp_updated_at();
    END IF;
END $$;

-- 7. REVISIÓN DE TABLAS ERP EXISTENTES (Asegurar que tengan políticas)
-- kardex
ALTER TABLE finanzas_biz_inventory_movements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'erp_movements_policy' AND tablename = 'finanzas_biz_inventory_movements') THEN
        CREATE POLICY erp_movements_policy ON finanzas_biz_inventory_movements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- proveedores
ALTER TABLE finanzas_biz_suppliers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'erp_suppliers_policy' AND tablename = 'finanzas_biz_suppliers') THEN
        CREATE POLICY erp_suppliers_policy ON finanzas_biz_suppliers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

SELECT 'Migración de Ventas y Reparación ERP completada' as status;
