-- ============================================================================
-- SCRIPT: FIX JOURNAL HEALTH LOG TABLE
-- PROPÓSITO: Ajustar la tabla para que coincida con el componente Journal.jsx
-- ============================================================================

-- 1. Eliminar la tabla actual para recrearla con el esquema correcto
DROP TABLE IF EXISTS public.journal_health_log CASCADE;

-- 2. Crear la tabla con los nuevos campos de salud mental
CREATE TABLE public.journal_health_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    anxiety_level integer CHECK (anxiety_level >= 0 AND anxiety_level <= 10),
    insomnia_level integer CHECK (insomnia_level >= 0 AND insomnia_level <= 10),
    medications jsonb DEFAULT '{}',
    meditation jsonb DEFAULT '{"morning": 0, "afternoon": 0, "night": 0}',
    diary_note text,
    symptoms text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE public.journal_health_log ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de acceso
CREATE POLICY "Users can view own journal_health_log" ON public.journal_health_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journal_health_log" ON public.journal_health_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal_health_log" ON public.journal_health_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal_health_log" ON public.journal_health_log FOR DELETE USING (auth.uid() = user_id);

-- 5. Crear índices
CREATE INDEX idx_journal_health_log_user_id ON public.journal_health_log(user_id);
CREATE INDEX idx_journal_health_log_date ON public.journal_health_log(date);

-- 6. Grant permissions
GRANT ALL ON public.journal_health_log TO authenticated;
GRANT ALL ON public.journal_health_log TO service_role;
