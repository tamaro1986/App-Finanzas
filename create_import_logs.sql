-- ============================================================================
-- SCRIPT: create_import_logs.sql (VERSION COMPLETA Y RE-EJECUTABLE)
-- PROPÓSITO: Crear la tabla para el historial de importaciones de Excel
-- ============================================================================

-- 1. Crear la tabla (si no existe)
CREATE TABLE IF NOT EXISTS public.import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    total_rows INTEGER DEFAULT 0,
    successful_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'completed', -- 'completed', 'partial', 'failed'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS (Seguridad a Nivel de Fila)
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- 3. Limpiar políticas existentes para evitar errores de "already exists"
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios logs de importación" ON public.import_logs;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios logs de importación" ON public.import_logs;
DROP POLICY IF EXISTS "Usuarios pueden borrar sus propios logs de importación" ON public.import_logs;

-- 4. Crear políticas de acceso
CREATE POLICY "Usuarios pueden ver sus propios logs de importación"
ON public.import_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propios logs de importación"
ON public.import_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden borrar sus propios logs de importación"
ON public.import_logs FOR DELETE USING (auth.uid() = user_id);

-- 5. Comentarios para la tabla
COMMENT ON TABLE public.import_logs IS 'Historial de importaciones de Excel realizadas por los usuarios';
