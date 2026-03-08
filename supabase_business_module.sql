-- ============================================================================
-- MÓDULO DE NEGOCIOS - SCRIPT DE SUPABASE
-- Ejecutar en el Editor SQL de Supabase para habilitar el módulo
-- ============================================================================

-- 1. TABLA: finanzas_business_products (Catálogo e Inventario)
CREATE TABLE IF NOT EXISTS finanzas_business_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sku TEXT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    current_stock NUMERIC DEFAULT 0,
    min_stock_level NUMERIC DEFAULT 5,
    average_cost NUMERIC DEFAULT 0,
    base_price NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA: finanzas_business_contacts (Clientes y Proveedores)
CREATE TABLE IF NOT EXISTS finanzas_business_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('cliente', 'proveedor')),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    tax_id TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA: finanzas_business_transactions (Ventas y Compras - Encabezado)
CREATE TABLE IF NOT EXISTS finanzas_business_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES finanzas_business_contacts(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('venta', 'compra', 'merma', 'ajuste')),
    status TEXT NOT NULL DEFAULT 'completada' CHECK (status IN ('completada', 'pendiente', 'cancelada')),
    total_amount NUMERIC DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA: finanzas_business_transaction_items (Detalle de Movimientos)
CREATE TABLE IF NOT EXISTS finanzas_business_transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES finanzas_business_transactions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES finanzas_business_products(id) ON DELETE RESTRICT,
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC DEFAULT 0,
    unit_price NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- POLÍTICAS RLS (Seguridad a Nivel de Fila)
-- ============================================================================

ALTER TABLE finanzas_business_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas_business_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas_business_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas_business_transaction_items ENABLE ROW LEVEL SECURITY;

-- Políticas para Products
CREATE POLICY "Users can manage their own products" 
ON finanzas_business_products FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Políticas para Contacts
CREATE POLICY "Users can manage their own contacts" 
ON finanzas_business_contacts FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Políticas para Transactions
CREATE POLICY "Users can manage their own transactions" 
ON finanzas_business_transactions FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Políticas para Transaction Items
CREATE POLICY "Users can manage their own transaction items" 
ON finanzas_business_transaction_items FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FUNCIONES AUTOMÁTICAS (Triggers para actualizar fechas)
-- ============================================================================
-- Crear función de actualización si no existe
CREATE OR REPLACE FUNCTION update_finanzas_business_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Asignar triggers
DROP TRIGGER IF EXISTS trigger_update_biz_products ON finanzas_business_products;
CREATE TRIGGER trigger_update_biz_products
BEFORE UPDATE ON finanzas_business_products
FOR EACH ROW EXECUTE FUNCTION update_finanzas_business_updated_at();

DROP TRIGGER IF EXISTS trigger_update_biz_contacts ON finanzas_business_contacts;
CREATE TRIGGER trigger_update_biz_contacts
BEFORE UPDATE ON finanzas_business_contacts
FOR EACH ROW EXECUTE FUNCTION update_finanzas_business_updated_at();

DROP TRIGGER IF EXISTS trigger_update_biz_transactions ON finanzas_business_transactions;
CREATE TRIGGER trigger_update_biz_transactions
BEFORE UPDATE ON finanzas_business_transactions
FOR EACH ROW EXECUTE FUNCTION update_finanzas_business_updated_at();
