-- ============================================================================
-- FIX: Cambiar paid_installments de INTEGER a JSONB para soportar arrays
-- Ejecutar en Supabase SQL Editor: https://supabase.com/dashboard
-- ============================================================================

-- Paso 1: Verificar el tipo actual de la columna
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'accounts' AND column_name = 'paid_installments';

-- Paso 2: Cambiar el tipo de columna a JSONB (soporta arrays)
-- Primero eliminamos la columna existente (si tiene datos, hacer backup primero)
ALTER TABLE accounts 
ALTER COLUMN paid_installments TYPE jsonb 
USING COALESCE(paid_installments::text::jsonb, '[]'::jsonb);

-- Si lo anterior falla, usar este enfoque alternativo:
-- ALTER TABLE accounts DROP COLUMN IF EXISTS paid_installments;
-- ALTER TABLE accounts ADD COLUMN paid_installments jsonb DEFAULT '[]'::jsonb;

-- Paso 3: Verificar que el cambio se aplicó
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'accounts' AND column_name = 'paid_installments';

-- ============================================================================
-- NOTA: Si la columna no existe, créala con este comando:
-- ============================================================================
-- ALTER TABLE accounts ADD COLUMN IF NOT EXISTS paid_installments jsonb DEFAULT '[]'::jsonb;
