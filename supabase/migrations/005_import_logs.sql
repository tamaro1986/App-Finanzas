-- Tabla para registrar el historial de importaciones
CREATE TABLE IF NOT EXISTS public.import_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    filename text NOT NULL,
    import_date timestamp with time zone DEFAULT now(),
    transaction_ids jsonb NOT NULL, -- Lista de IDs de transacciones importadas
    row_count integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users can view own import_logs" ON public.import_logs;
DROP POLICY IF EXISTS "Users can insert own import_logs" ON public.import_logs;
DROP POLICY IF EXISTS "Users can delete own import_logs" ON public.import_logs;

CREATE POLICY "Users can view own import_logs" ON public.import_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own import_logs" ON public.import_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own import_logs" ON public.import_logs FOR DELETE USING (auth.uid() = user_id);
