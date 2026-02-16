-- ============================================================================
-- SQL: REPARACIÓN INTEGRAL DE TABLAS (V2)
-- PROPÓSITO: Corregir TODAS las discrepancias entre la App y la BD
-- ============================================================================

-- 1. TABLA 'transactions' (Asegurar soporte para transferencias)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS is_transfer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS transfer_id UUID;

-- 2. TABLA 'accounts' (Asegurar soporte para préstamos)
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS loan_details jsonb,
ADD COLUMN IF NOT EXISTS paid_installments integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_installments integer,
ADD COLUMN IF NOT EXISTS interest_rate numeric,
ADD COLUMN IF NOT EXISTS installment_amount numeric;

-- 3. TABLA 'patients' (Agregar campos usados en MedicalHistory.jsx)
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS blood_type text,
ADD COLUMN IF NOT EXISTS allergies text,
ADD COLUMN IF NOT EXISTS notes text;

-- 4. TABLA 'medical_records' (Reparación total para coincidir con MedicalHistory.jsx)
ALTER TABLE public.medical_records 
ADD COLUMN IF NOT EXISTS person_name text,
ADD COLUMN IF NOT EXISTS reason text,
ADD COLUMN IF NOT EXISTS doctor_name text,
ADD COLUMN IF NOT EXISTS doctor_comments text,
ADD COLUMN IF NOT EXISTS height numeric,
ADD COLUMN IF NOT EXISTS weight numeric,
ADD COLUMN IF NOT EXISTS recipe_image text,
ADD COLUMN IF NOT EXISTS audio_note text,
ADD COLUMN IF NOT EXISTS has_follow_up boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS follow_up_date date,
ADD COLUMN IF NOT EXISTS medications_list jsonb,
ADD COLUMN IF NOT EXISTS type text; -- Usado como "Consulta" o motivo

-- 5. TABLA 'investments' (Ajustar a InvestmentPortfolio.jsx)
ALTER TABLE public.investments
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS buy_price numeric,
ADD COLUMN IF NOT EXISTS buy_date date,
ADD COLUMN IF NOT EXISTS last_update bigint,
ADD COLUMN IF NOT EXISTS current_price numeric,
ADD COLUMN IF NOT EXISTS commission numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS buy_currency text DEFAULT 'USD';

-- Renombrar columnas si existen para evitar duplicidad de datos
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investments' AND column_name = 'purchase_price') THEN
    ALTER TABLE public.investments RENAME COLUMN purchase_price TO buy_price;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investments' AND column_name = 'purchase_date') THEN
    ALTER TABLE public.investments RENAME COLUMN purchase_date TO buy_date;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investments' AND column_name = 'ticker') THEN
    ALTER TABLE public.investments RENAME COLUMN ticker TO symbol;
  END IF;
END $$;

-- 6. TABLA 'journal_med_list' (Corregir estructura)
-- Primero eliminar si existe con estructura incorrecta o asegurar que tiene 'list'
ALTER TABLE public.journal_med_list 
ADD COLUMN IF NOT EXISTS list jsonb DEFAULT '[]'::jsonb;

-- 7. PERMISOS RLS (Asegurar acceso)
-- Repetir para todas las tablas por seguridad
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_med_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- Finalizar
SELECT 'Reparación integral V2 completada con éxito.' as result;
