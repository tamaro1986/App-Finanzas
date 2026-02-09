-- ============================================================================
-- FIX: Agregar columnas faltantes a la tabla journal_tcc
-- ============================================================================

-- Verificar estructura actual
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'journal_tcc'
ORDER BY ordinal_position;

-- Agregar columnas faltantes (si no existen)
ALTER TABLE public.journal_tcc 
ADD COLUMN IF NOT EXISTS situation text,
ADD COLUMN IF NOT EXISTS emotions text,
ADD COLUMN IF NOT EXISTS automatic_thought text,
ADD COLUMN IF NOT EXISTS distortion text,
ADD COLUMN IF NOT EXISTS refutation text,
ADD COLUMN IF NOT EXISTS reevaluation text,
ADD COLUMN IF NOT EXISTS date text,
ADD COLUMN IF NOT EXISTS created_at text,
ADD COLUMN IF NOT EXISTS updated_at text;

-- Verificar estructura después del fix
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'journal_tcc'
ORDER BY ordinal_position;

-- Mensaje de confirmación
SELECT '✅ Tabla journal_tcc actualizada correctamente' as status;
