-- ============================================================================
-- MIGRACIÓN: Agregar columna 'age' a la tabla patients
-- ============================================================================

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS age integer;

-- Verificar que se agregó correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients' 
ORDER BY ordinal_position;
