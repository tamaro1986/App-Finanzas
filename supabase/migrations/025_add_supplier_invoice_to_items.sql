-- ============================================================================
-- ADD SUPPLIER AND INVOICE TO PURCHASE ITEMS & MOVEMENTS
-- ============================================================================

-- 1. Actualizar tabla de Detalle de Compras
ALTER TABLE public.finanzas_biz_purchase_items
    ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.finanzas_biz_suppliers(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- 2. Actualizar tabla de Movimientos de Inventario (Kardex)
ALTER TABLE public.finanzas_biz_inventory_movements
    ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.finanzas_biz_suppliers(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- 3. Habilitar RLS si no estaba (ya debería estar pero por seguridad)
-- Nota: Las políticas existentes en 022_erp_inventory.sql ya usan auth.uid() = user_id por lo que cubrirán las nuevas columnas.

COMMENT ON COLUMN public.finanzas_biz_purchase_items.supplier_id IS 'Proveedor específico para esta partida de compra';
COMMENT ON COLUMN public.finanzas_biz_purchase_items.invoice_number IS 'Número de factura específico para esta partida de compra';
COMMENT ON COLUMN public.finanzas_biz_inventory_movements.supplier_id IS 'Proveedor origen del movimiento (si aplica)';
COMMENT ON COLUMN public.finanzas_biz_inventory_movements.invoice_number IS 'Factura vinculada al movimiento';
