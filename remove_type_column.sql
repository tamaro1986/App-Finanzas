-- ============================================================================
-- FIX: Eliminar columna 'type' que causa error de NOT NULL constraint
-- ============================================================================

-- La aplicación usa 'asset_type', no 'type'
-- La columna 'type' es legacy y tiene constraint NOT NULL que causa errores

-- Eliminar la columna 'type'
ALTER TABLE public.investments 
DROP COLUMN IF EXISTS type;

-- Verificar que se eliminó y que asset_type existe
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'investments'
AND column_name IN ('type', 'asset_type')
ORDER BY column_name;

-- Debería mostrar solo 'asset_type', NO 'type'
SELECT 
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'investments' AND column_name = 'type'
        ) THEN '✅ Columna "type" eliminada correctamente'
        ELSE '❌ ERROR: Columna "type" aún existe'
    END as status;
