-- ============================================================================
-- SCRIPT: FIX JOURNAL TCC TABLE
-- PROPÓSITO: Ajustar la tabla para que coincida con el componente Journal.jsx
-- ============================================================================

-- 1. Eliminar la tabla actual para recrearla con el esquema correcto
DROP TABLE IF EXISTS public.journal_tcc CASCADE;

-- 2. Crear la tabla con los campos correctos para el Registro de Pensamientos
CREATE TABLE public.journal_tcc (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date timestamp with time zone NOT NULL,
    situation text,
    emotions text,
    automatic_thought text,
    distortion text,
    refutation text,
    reevaluation text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE public.journal_health_log ENABLE ROW LEVEL SECURITY; -- Error en el script anterior, corregido abajo
ALTER TABLE public.journal_tcc ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de acceso
CREATE POLICY "Users can view own journal_tcc" ON public.journal_tcc FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journal_tcc" ON public.journal_tcc FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal_tcc" ON public.journal_tcc FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal_tcc" ON public.journal_tcc FOR DELETE USING (auth.uid() = user_id);

-- 5. Crear índices
CREATE INDEX idx_journal_tcc_user_id ON public.journal_tcc(user_id);
CREATE INDEX idx_journal_tcc_date ON public.journal_tcc(date);

-- 6. Grant permissions
GRANT ALL ON public.journal_tcc TO authenticated;
GRANT ALL ON public.journal_tcc TO service_role;
