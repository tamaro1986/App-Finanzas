-- ============================================================================
-- SCRIPT: FIX MEDICATIONS TABLE FOR JOURNAL
-- PROPÓSITO: Crear tabla medications que almacena la lista de medicamentos
--            para el módulo de bitácora de salud (Journal)
-- ============================================================================

-- NOTA: La tabla actual 'medications' es para el módulo de pacientes médicos
-- El Journal necesita una tabla diferente llamada 'journal_med_list'

-- 1. Eliminar tabla si existe (NO afecta la tabla 'medications' de pacientes)
DROP TABLE IF EXISTS public.journal_med_list CASCADE;

-- 2. Crear tabla para lista de medicamentos del journal
CREATE TABLE public.journal_med_list (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    list jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE public.journal_med_list ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de acceso
CREATE POLICY "Users can view own journal_med_list" ON public.journal_med_list FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journal_med_list" ON public.journal_med_list FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal_med_list" ON public.journal_med_list FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal_med_list" ON public.journal_med_list FOR DELETE USING (auth.uid() = user_id);

-- 5. Crear índice
CREATE INDEX idx_journal_med_list_user_id ON public.journal_med_list(user_id);

-- 6. Grant permissions
GRANT ALL ON public.journal_med_list TO authenticated;
GRANT ALL ON public.journal_med_list TO service_role;
