-- Verificar políticas RLS de la tabla investments
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'investments';

-- Verificar si RLS está habilitado
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename = 'investments';
