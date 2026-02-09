-- Verificar TODOS los campos de tipo fecha/timestamp en investments
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'investments'
AND (data_type LIKE '%date%' OR data_type LIKE '%time%')
ORDER BY ordinal_position;

-- Ver la estructura COMPLETA
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'investments'
ORDER BY ordinal_position;
