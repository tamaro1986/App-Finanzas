-- ============================================================================
-- MASTER MIGRATION: REPARACIÓN INTEGRAL DE TABLAS
-- PROPÓSITO: Corregir errores de columnas faltantes y discrepancias de nombres
-- ============================================================================

-- 1. CORRECCIÓN DE TABLA 'transactions' (Error: is_transfer missing)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS is_transfer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS transfer_id UUID;

-- Renombrar columnas camelCase a snake_case si existen (el sync lo requiere)
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'accountId') THEN
    ALTER TABLE public.transactions RENAME COLUMN "accountId" TO account_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'categoryId') THEN
    ALTER TABLE public.transactions RENAME COLUMN "categoryId" TO category_id;
  END IF;
END $$;

-- 2. CORRECCIÓN DE TABLA 'accounts'
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS loan_details jsonb,
ADD COLUMN IF NOT EXISTS paid_installments integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_installments integer,
ADD COLUMN IF NOT EXISTS interest_rate numeric,
ADD COLUMN IF NOT EXISTS installment_amount numeric;

-- Renombrar loanDetails si existe
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'loanDetails') THEN
    ALTER TABLE public.accounts RENAME COLUMN "loanDetails" TO loan_details;
  END IF;
END $$;

-- 3. VERIFICAR TABLA 'journal_med_list' (Asegurar que existe)
CREATE TABLE IF NOT EXISTS public.journal_med_list (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    list jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS para journal_med_list si no lo está
ALTER TABLE public.journal_med_list ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journal_med_list') THEN
    CREATE POLICY "Users can view own journal_med_list" ON public.journal_med_list FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own journal_med_list" ON public.journal_med_list FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own journal_med_list" ON public.journal_med_list FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own journal_med_list" ON public.journal_med_list FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Dar permisos
GRANT ALL ON public.transactions TO authenticated;
GRANT ALL ON public.accounts TO authenticated;
GRANT ALL ON public.journal_med_list TO authenticated;

-- Finalizar
SELECT 'Reparación completada. Verifica las columnas de transactions y accounts.' as status;
