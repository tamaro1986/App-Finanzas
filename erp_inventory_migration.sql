-- ============================================================================
-- ERP INVENTORY MODULE - MIGRACIÓN COMPLETA
-- Ejecutar en el Editor SQL de Supabase
-- NOTA: Este script es idempotente (se puede ejecutar múltiples veces de forma segura)
-- ============================================================================

-- ===== PASO 1: ACTUALIZAR TABLA EXISTENTE DE PRODUCTOS =====
ALTER TABLE finanzas_business_products
    ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'producto_terminado'
        CHECK (product_type IN ('materia_prima', 'producto_terminado')),
    ADD COLUMN IF NOT EXISTS unit_of_measure TEXT DEFAULT 'und',
    ADD COLUMN IF NOT EXISTS markup_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'activo'
        CHECK (status IN ('activo', 'inactivo'));

-- ===== PASO 2: TABLA DE PROVEEDORES =====
CREATE TABLE IF NOT EXISTS finanzas_biz_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    tax_id TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== PASO 3: TABLA DE COMPRAS (Encabezado) =====
CREATE TABLE IF NOT EXISTS finanzas_biz_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES finanzas_biz_suppliers(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'completada' CHECK (status IN ('completada', 'pendiente', 'cancelada')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== PASO 4: TABLA DE DETALLE DE COMPRAS =====
CREATE TABLE IF NOT EXISTS finanzas_biz_purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    purchase_id UUID NOT NULL REFERENCES finanzas_biz_purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES finanzas_business_products(id) ON DELETE RESTRICT,
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC NOT NULL DEFAULT 0,
    subtotal NUMERIC GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== PASO 5: TABLA DE RECETAS =====
CREATE TABLE IF NOT EXISTS finanzas_biz_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES finanzas_business_products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== PASO 6: TABLA DE INGREDIENTES DE RECETA =====
CREATE TABLE IF NOT EXISTS finanzas_biz_recipe_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES finanzas_biz_recipes(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL REFERENCES finanzas_business_products(id) ON DELETE RESTRICT,
    quantity_required NUMERIC NOT NULL CHECK (quantity_required > 0),
    unit_of_measure TEXT DEFAULT 'und',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== PASO 7: TABLA DE ÓRDENES DE PRODUCCIÓN =====
CREATE TABLE IF NOT EXISTS finanzas_biz_production_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES finanzas_biz_recipes(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES finanzas_business_products(id) ON DELETE RESTRICT,
    quantity_to_produce NUMERIC NOT NULL CHECK (quantity_to_produce > 0),
    status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'finalizado', 'cancelado')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== PASO 8: TABLA KARDEX (Movimientos de Inventario) =====
CREATE TABLE IF NOT EXISTS finanzas_biz_inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES finanzas_business_products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (
        movement_type IN ('COMPRA', 'VENTA', 'PRODUCCION_ENTRADA', 'PRODUCCION_SALIDA', 'AJUSTE', 'DEVOLUCION')
    ),
    quantity NUMERIC NOT NULL,
    stock_before NUMERIC NOT NULL,
    stock_after NUMERIC NOT NULL,
    unit_cost NUMERIC DEFAULT 0,
    reference_id UUID,
    reference_type TEXT,
    notes TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================================================
ALTER TABLE finanzas_biz_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas_biz_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas_biz_purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas_biz_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas_biz_recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas_biz_production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas_biz_inventory_movements ENABLE ROW LEVEL SECURITY;

-- Políticas (idempotentes con DROP IF EXISTS)
DROP POLICY IF EXISTS erp_suppliers_policy ON finanzas_biz_suppliers;
CREATE POLICY erp_suppliers_policy ON finanzas_biz_suppliers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS erp_purchases_policy ON finanzas_biz_purchases;
CREATE POLICY erp_purchases_policy ON finanzas_biz_purchases FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS erp_purchase_items_policy ON finanzas_biz_purchase_items;
CREATE POLICY erp_purchase_items_policy ON finanzas_biz_purchase_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS erp_recipes_policy ON finanzas_biz_recipes;
CREATE POLICY erp_recipes_policy ON finanzas_biz_recipes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS erp_recipe_items_policy ON finanzas_biz_recipe_items;
CREATE POLICY erp_recipe_items_policy ON finanzas_biz_recipe_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS erp_prod_orders_policy ON finanzas_biz_production_orders;
CREATE POLICY erp_prod_orders_policy ON finanzas_biz_production_orders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS erp_movements_policy ON finanzas_biz_inventory_movements;
CREATE POLICY erp_movements_policy ON finanzas_biz_inventory_movements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRIGGER: updated_at automático
-- ============================================================================
CREATE OR REPLACE FUNCTION update_erp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_suppliers_updated_at ON finanzas_biz_suppliers;
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON finanzas_biz_suppliers FOR EACH ROW EXECUTE FUNCTION update_erp_updated_at();

DROP TRIGGER IF EXISTS trg_purchases_updated_at ON finanzas_biz_purchases;
CREATE TRIGGER trg_purchases_updated_at BEFORE UPDATE ON finanzas_biz_purchases FOR EACH ROW EXECUTE FUNCTION update_erp_updated_at();

DROP TRIGGER IF EXISTS trg_recipes_updated_at ON finanzas_biz_recipes;
CREATE TRIGGER trg_recipes_updated_at BEFORE UPDATE ON finanzas_biz_recipes FOR EACH ROW EXECUTE FUNCTION update_erp_updated_at();

DROP TRIGGER IF EXISTS trg_production_updated_at ON finanzas_biz_production_orders;
CREATE TRIGGER trg_production_updated_at BEFORE UPDATE ON finanzas_biz_production_orders FOR EACH ROW EXECUTE FUNCTION update_erp_updated_at();
