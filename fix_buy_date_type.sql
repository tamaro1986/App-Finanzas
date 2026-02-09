-- ============================================================================
-- FIX: Cambiar buy_date de tipo date a text para aceptar cualquier formato
-- ============================================================================

-- Cambiar el tipo de dato de buy_date
ALTER TABLE public.investments 
ALTER COLUMN buy_date TYPE text;

-- Verificar el cambio
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'investments' 
AND column_name = 'buy_date';

SELECT '✅ Campo buy_date actualizado a tipo text' as status;
