-- Ver la estructura COMPLETA actual de investments
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'investments'
ORDER BY ordinal_position;
