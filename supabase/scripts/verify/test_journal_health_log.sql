-- ============================================================================
-- SCRIPT DE PRUEBA: Verificar estructura de journal_health_log
-- PROPÓSITO: Revisar si los datos se están guardando correctamente
-- ============================================================================

-- 1. Ver la estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'journal_health_log'
ORDER BY ordinal_position;

-- 2. Ver todos los registros actuales
SELECT 
    id,
    date,
    anxiety_level,
    insomnia_level,
    medications,
    meditation,
    diary_note,
    symptoms,
    created_at
FROM public.journal_health_log
ORDER BY date DESC
LIMIT 10;

-- 3. Verificar si hay registros con diary_note vacío o NULL
SELECT 
    COUNT(*) as total_registros,
    COUNT(diary_note) as con_notas,
    COUNT(*) - COUNT(diary_note) as sin_notas
FROM public.journal_health_log;
