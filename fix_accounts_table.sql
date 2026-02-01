-- ============================================================================
-- SCRIPT: AGREGAR TODAS LAS COLUMNAS FALTANTES A LA TABLA ACCOUNTS
-- ============================================================================

-- Agregar columna user_id (si no existe)
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Agregar columna name (si no existe)
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS name text;

-- Agregar columna type (si no existe)
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS type text;

-- Agregar columna loan_details (si no existe)
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS loan_details jsonb;

-- Agregar columna paid_installments (si no existe)
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS paid_installments integer DEFAULT 0;

-- Agregar columna total_installments (si no existe)
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS total_installments integer;

-- Agregar columna interest_rate (si no existe)
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS interest_rate numeric;

-- Agregar columna installment_amount (si no existe)
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS installment_amount numeric;

-- Verificar que las columnas se agregaron
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'accounts' 
ORDER BY ordinal_position;
