-- ============================================================================
-- AGREGAR POLÍTICAS RLS A LA TABLA INVESTMENTS
-- ============================================================================

-- 1. Habilitar RLS en la tabla
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes si las hay (para evitar duplicados)
DROP POLICY IF EXISTS "Users can view own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can insert own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can update own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can delete own investments" ON public.investments;

-- 3. Crear políticas para SELECT (ver)
CREATE POLICY "Users can view own investments"
ON public.investments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Crear políticas para INSERT (insertar)
CREATE POLICY "Users can insert own investments"
ON public.investments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Crear políticas para UPDATE (actualizar)
CREATE POLICY "Users can update own investments"
ON public.investments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Crear políticas para DELETE (eliminar)
CREATE POLICY "Users can delete own investments"
ON public.investments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Verificar que las políticas se crearon
SELECT 
    policyname as "Política",
    cmd as "Operación"
FROM pg_policies
WHERE tablename = 'investments';

SELECT '✅ Políticas RLS configuradas correctamente para investments' as status;
