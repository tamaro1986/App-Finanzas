-- ============================================================================
-- SCRIPT COMPLETO: CREAR TODAS LAS TABLAS DE LA APLICACIÓN EN SUPABASE
-- ============================================================================
-- Este script crea todas las tablas necesarias para todos los módulos
-- Incluye: Finanzas, Salud, Vehículos, Inversiones, y Diarios
-- ============================================================================

-- PASO 1: Eliminar tablas existentes (para empezar limpio)
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.vehicles CASCADE;
DROP TABLE IF EXISTS public.medical_records CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.journal_tcc CASCADE;
DROP TABLE IF EXISTS public.journal_health_log CASCADE;
DROP TABLE IF EXISTS public.medications CASCADE;
DROP TABLE IF EXISTS public.investments CASCADE;

-- ============================================================================
-- MÓDULO: FINANZAS
-- ============================================================================

-- TABLA: accounts (Cuentas)
CREATE TABLE public.accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    balance numeric DEFAULT 0,
    color text,
    loan_details jsonb,
    paid_installments integer DEFAULT 0,
    total_installments integer,
    interest_rate numeric,
    installment_amount numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- TABLA: transactions (Transacciones)
CREATE TABLE public.transactions (
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

-- TABLA: budgets (Presupuestos)
CREATE TABLE public.budgets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    month text NOT NULL,
    categories jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, month)
);

-- ============================================================================
-- MÓDULO: VEHÍCULOS
-- ============================================================================

-- TABLA: vehicles (Vehículos)
CREATE TABLE public.vehicles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    plate text NOT NULL,
    type text NOT NULL DEFAULT 'Carro',
    current_mileage integer NOT NULL DEFAULT 0,
    maintenance_items jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- MÓDULO: SALUD
-- ============================================================================

-- TABLA: patients (Pacientes)
CREATE TABLE public.patients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    birth_date date,
    gender text,
    blood_type text,
    phone text,
    email text,
    address text,
    emergency_contact text,
    emergency_phone text,
    allergies text,
    chronic_conditions text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- TABLA: medical_records (Registros Médicos)
CREATE TABLE public.medical_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
    date date NOT NULL,
    type text NOT NULL,
    doctor text,
    diagnosis text,
    treatment text,
    medications text,
    notes text,
    attachments jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- TABLA: medications (Medicamentos)
CREATE TABLE public.medications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
    name text NOT NULL,
    dosage text,
    frequency text,
    start_date date,
    end_date date,
    prescribing_doctor text,
    notes text,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- MÓDULO: DIARIOS
-- ============================================================================

-- TABLA: journal_tcc (Diario TCC - Terapia Cognitivo Conductual)
CREATE TABLE public.journal_tcc (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    situation text,
    thoughts text,
    emotions text,
    behaviors text,
    reevaluation text,
    mood_rating integer CHECK (mood_rating >= 1 AND mood_rating <= 10),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- TABLA: journal_health_log (Registro de Salud Diario)
CREATE TABLE public.journal_health_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    sleep_hours numeric,
    sleep_quality integer CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
    exercise_minutes integer,
    water_intake numeric,
    meals_count integer,
    mood integer CHECK (mood >= 1 AND mood <= 10),
    energy_level integer CHECK (energy_level >= 1 AND energy_level <= 10),
    stress_level integer CHECK (stress_level >= 1 AND stress_level <= 10),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- MÓDULO: INVERSIONES
-- ============================================================================

-- TABLA: investments (Inversiones)
CREATE TABLE public.investments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    buy_date date NOT NULL,
    buy_price numeric NOT NULL,
    quantity numeric NOT NULL,
    current_price numeric,
    last_update timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- PASO 2: HABILITAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
-- ============================================================================

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_tcc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_health_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASO 3: CREAR POLÍTICAS RLS (Row Level Security)
-- ============================================================================

-- POLÍTICAS PARA: transactions
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS PARA: accounts
CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS PARA: budgets
CREATE POLICY "Users can view own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS PARA: vehicles
CREATE POLICY "Users can view own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vehicles" ON public.vehicles FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS PARA: patients
CREATE POLICY "Users can view own patients" ON public.patients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patients" ON public.patients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own patients" ON public.patients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own patients" ON public.patients FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS PARA: medical_records
CREATE POLICY "Users can view own medical_records" ON public.medical_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medical_records" ON public.medical_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medical_records" ON public.medical_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own medical_records" ON public.medical_records FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS PARA: medications
CREATE POLICY "Users can view own medications" ON public.medications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medications" ON public.medications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medications" ON public.medications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own medications" ON public.medications FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS PARA: journal_tcc
CREATE POLICY "Users can view own journal_tcc" ON public.journal_tcc FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journal_tcc" ON public.journal_tcc FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal_tcc" ON public.journal_tcc FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal_tcc" ON public.journal_tcc FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS PARA: journal_health_log
CREATE POLICY "Users can view own journal_health_log" ON public.journal_health_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journal_health_log" ON public.journal_health_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal_health_log" ON public.journal_health_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal_health_log" ON public.journal_health_log FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS PARA: investments
CREATE POLICY "Users can view own investments" ON public.investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own investments" ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own investments" ON public.investments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own investments" ON public.investments FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- PASO 4: CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================================================

-- Índices para transactions
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);

-- Índices para accounts
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);

-- Índices para budgets
CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX idx_budgets_month ON public.budgets(month);

-- Índices para vehicles
CREATE INDEX idx_vehicles_user_id ON public.vehicles(user_id);

-- Índices para patients
CREATE INDEX idx_patients_user_id ON public.patients(user_id);

-- Índices para medical_records
CREATE INDEX idx_medical_records_user_id ON public.medical_records(user_id);
CREATE INDEX idx_medical_records_patient_id ON public.medical_records(patient_id);
CREATE INDEX idx_medical_records_date ON public.medical_records(date);

-- Índices para medications
CREATE INDEX idx_medications_user_id ON public.medications(user_id);
CREATE INDEX idx_medications_patient_id ON public.medications(patient_id);

-- Índices para journal_tcc
CREATE INDEX idx_journal_tcc_user_id ON public.journal_tcc(user_id);
CREATE INDEX idx_journal_tcc_date ON public.journal_tcc(date);

-- Índices para journal_health_log
CREATE INDEX idx_journal_health_log_user_id ON public.journal_health_log(user_id);
CREATE INDEX idx_journal_health_log_date ON public.journal_health_log(date);

-- Índices para investments
CREATE INDEX idx_investments_user_id ON public.investments(user_id);

-- ============================================================================
-- ¡LISTO! Verificar que todas las tablas se crearon correctamente
-- ============================================================================

SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN (
        'transactions', 'accounts', 'budgets', 'vehicles', 
        'medical_records', 'patients', 'journal_tcc', 
        'journal_health_log', 'medications', 'investments'
    )
ORDER BY table_name;
