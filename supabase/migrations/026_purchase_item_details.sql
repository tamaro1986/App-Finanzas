-- ============================================================================
-- SQL: DETALLE DE PROVEEDOR Y FACTURA POR ITEM DE COMPRA
-- PROPÓSITO: Extender la tabla de items de compra con detalles individuales
-- ============================================================================

-- 1. Agregar columnas a 'finanzas_biz_purchase_items'
ALTER TABLE public.finanzas_biz_purchase_items
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES finanzas_biz_suppliers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- 2. Asegurar que 'finanzas_biz_inventory_movements' tiene soporte (ya tiene 'notes')
-- Si se requiere un campo específico en el futuro para búsqueda por factura:
-- ALTER TABLE public.finanzas_biz_inventory_movements ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- 3. Notificación final
SELECT 'Columnas supplier_id y invoice_number agregadas a finanzas_biz_purchase_items.' as result;
