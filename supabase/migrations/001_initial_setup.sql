-- ============================================================================
-- SCRIPT DE VERIFICACIÓN Y CORRECCIÓN DE TABLAS SUPABASE
-- PROPÓSITO: Asegurar que todas las tablas tengan la estructura correcta
--            y las políticas RLS necesarias para el funcionamiento correcto
-- ============================================================================

-- PASO 1: Verificar si las tablas existen
-- Ejecuta esto primero para ver qué tablas ya tienes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('transactions', 'accounts', 'budgets', 'vehicles', 'medical_records', 'patients', 'journal_cbt', 'journal_health_log', 'journal_med_list', 'investments');

-- ============================================================================
-- PASO 2: CREAR TABLAS (si no existen)
-- ============================================================================

-- Tabla: transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    account_id uuid NOT NULL,
    category_id text NOT NULL,
    amount numeric NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    note text,
    attachment text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabla: accounts
CREATE TABLE IF NOT EXISTS public.accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    balance numeric DEFAULT 0,
    color text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabla: budgets
CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    month text NOT NULL,
    categories jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, month)
);

-- Tabla: vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    brand text NOT NULL,
    model text NOT NULL,
    year integer,
    plate text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabla: medical_records
CREATE TABLE IF NOT EXISTS public.medical_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    patient_id uuid,
    date date NOT NULL,
    diagnosis text,
    treatment text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabla: patients
CREATE TABLE IF NOT EXISTS public.patients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    birth_date date,
    contact text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabla: journal_cbt (TCC Entries)
CREATE TABLE IF NOT EXISTS public.journal_cbt (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date timestamp with time zone NOT NULL,
    situation text,
    automatic_thought text,
    emotion text,
    intensity integer,
    rational_response text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabla: journal_health_log
CREATE TABLE IF NOT EXISTS public.journal_health_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date timestamp with time zone NOT NULL,
    mood integer,
    anxiety integer,
    sleep_quality integer,
    medications jsonb,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabla: journal_med_list
CREATE TABLE IF NOT EXISTS public.journal_med_list (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    medication_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, medication_name)
);

-- Tabla: investments
CREATE TABLE IF NOT EXISTS public.investments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    broker text NOT NULL,
    asset_type text NOT NULL,
    ticker text NOT NULL,
    quantity numeric NOT NULL,
    purchase_price numeric NOT NULL,
    purchase_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- PASO 3: HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_cbt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_health_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_med_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASO 4: CREAR POLÍTICAS RLS
-- ============================================================================

-- NOTA: Primero eliminamos las políticas existentes para evitar conflictos
-- Luego creamos las nuevas políticas

-- Políticas para TRANSACTIONS
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
ON public.transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
ON public.transactions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
ON public.transactions FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para ACCOUNTS
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON public.accounts;

CREATE POLICY "Users can view own accounts"
ON public.accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
ON public.accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
ON public.accounts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
ON public.accounts FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para BUDGETS
DROP POLICY IF EXISTS "Users can view own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON public.budgets;

CREATE POLICY "Users can view own budgets"
ON public.budgets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
ON public.budgets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
ON public.budgets FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
ON public.budgets FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para VEHICLES
DROP POLICY IF EXISTS "Users can view own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can insert own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON public.vehicles;

CREATE POLICY "Users can view own vehicles"
ON public.vehicles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles"
ON public.vehicles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles"
ON public.vehicles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles"
ON public.vehicles FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para MEDICAL_RECORDS
DROP POLICY IF EXISTS "Users can view own medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "Users can insert own medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "Users can update own medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "Users can delete own medical_records" ON public.medical_records;

CREATE POLICY "Users can view own medical_records"
ON public.medical_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medical_records"
ON public.medical_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medical_records"
ON public.medical_records FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own medical_records"
ON public.medical_records FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para PATIENTS
DROP POLICY IF EXISTS "Users can view own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can insert own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can update own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can delete own patients" ON public.patients;

CREATE POLICY "Users can view own patients"
ON public.patients FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patients"
ON public.patients FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patients"
ON public.patients FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own patients"
ON public.patients FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para JOURNAL_CBT
DROP POLICY IF EXISTS "Users can view own journal_cbt" ON public.journal_cbt;
DROP POLICY IF EXISTS "Users can insert own journal_cbt" ON public.journal_cbt;
DROP POLICY IF EXISTS "Users can update own journal_cbt" ON public.journal_cbt;
DROP POLICY IF EXISTS "Users can delete own journal_cbt" ON public.journal_cbt;

CREATE POLICY "Users can view own journal_cbt"
ON public.journal_cbt FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal_cbt"
ON public.journal_cbt FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal_cbt"
ON public.journal_cbt FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal_cbt"
ON public.journal_cbt FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para JOURNAL_HEALTH_LOG
DROP POLICY IF EXISTS "Users can view own journal_health_log" ON public.journal_health_log;
DROP POLICY IF EXISTS "Users can insert own journal_health_log" ON public.journal_health_log;
DROP POLICY IF EXISTS "Users can update own journal_health_log" ON public.journal_health_log;
DROP POLICY IF EXISTS "Users can delete own journal_health_log" ON public.journal_health_log;

CREATE POLICY "Users can view own journal_health_log"
ON public.journal_health_log FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal_health_log"
ON public.journal_health_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal_health_log"
ON public.journal_health_log FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal_health_log"
ON public.journal_health_log FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para JOURNAL_MED_LIST
DROP POLICY IF EXISTS "Users can view own journal_med_list" ON public.journal_med_list;
DROP POLICY IF EXISTS "Users can insert own journal_med_list" ON public.journal_med_list;
DROP POLICY IF EXISTS "Users can update own journal_med_list" ON public.journal_med_list;
DROP POLICY IF EXISTS "Users can delete own journal_med_list" ON public.journal_med_list;

CREATE POLICY "Users can view own journal_med_list"
ON public.journal_med_list FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal_med_list"
ON public.journal_med_list FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal_med_list"
ON public.journal_med_list FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal_med_list"
ON public.journal_med_list FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para INVESTMENTS
DROP POLICY IF EXISTS "Users can view own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can insert own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can update own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can delete own investments" ON public.investments;

CREATE POLICY "Users can view own investments"
ON public.investments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investments"
ON public.investments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments"
ON public.investments FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own investments"
ON public.investments FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- PASO 5: CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON public.vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_user_id ON public.medical_records(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_cbt_user_id ON public.journal_cbt(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_health_log_user_id ON public.journal_health_log(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_med_list_user_id ON public.journal_med_list(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments(user_id);

-- ============================================================================
-- PASO 6: VERIFICACIÓN FINAL
-- ============================================================================

-- Verificar que RLS esté habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('transactions', 'accounts', 'budgets', 'vehicles', 'medical_records', 'patients', 'journal_cbt', 'journal_health_log', 'journal_med_list', 'investments');

-- Verificar políticas creadas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('transactions', 'accounts', 'budgets', 'vehicles', 'medical_records', 'patients', 'journal_cbt', 'journal_health_log', 'journal_med_list', 'investments')
ORDER BY tablename, policyname;

-- ============================================================================
-- INSTRUCCIONES DE USO:
-- ============================================================================
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Navega a SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script
-- 5. Verifica que no haya errores en la salida
-- 6. Si hay errores, léelos cuidadosamente y corrígelos
-- 7. Una vez completado, intenta usar la aplicación nuevamente
-- ============================================================================
