-- Ver la estructura COMPLETA de la tabla investments
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'investments'
ORDER BY ordinal_position;

-- Ver si hay restricciones o índices únicos que puedan causar conflictos
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'investments';
