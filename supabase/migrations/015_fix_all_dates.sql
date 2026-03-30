-- ============================================================================
-- FIX COMPLETO: Cambiar TODOS los campos de fecha a tipos compatibles
-- ============================================================================

-- 1. Cambiar buy_date de date a text
ALTER TABLE public.investments 
ALTER COLUMN buy_date TYPE text;

-- 2. Cambiar created_at de timestamptz a bigint (si existe)
ALTER TABLE public.investments 
ALTER COLUMN created_at TYPE bigint USING extract(epoch from created_at)::bigint * 1000;

-- 3. Cambiar updated_at de timestamptz a bigint (si existe)
ALTER TABLE public.investments 
ALTER COLUMN updated_at TYPE bigint USING extract(epoch from updated_at)::bigint * 1000;

-- Verificar los cambios
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'investments'
AND column_name IN ('buy_date', 'created_at', 'updated_at')
ORDER BY ordinal_position;

SELECT '✅ Todos los campos de fecha actualizados' as status;
