-- ============================================================================
-- SCRIPT SIMPLIFICADO: CREAR TABLAS ESENCIALES
-- ============================================================================
-- Este script crea solo las tablas necesarias para que la app funcione
-- ============================================================================

-- PASO 1: Eliminar tablas si existen (para empezar limpio)
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;

-- ============================================================================
-- PASO 2: CREAR TABLA ACCOUNTS
-- ============================================================================
CREATE TABLE public.accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    balance numeric DEFAULT 0,
    color text,
    "loanDetails" jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- PASO 3: CREAR TABLA TRANSACTIONS
-- ============================================================================
CREATE TABLE public.transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    "accountId" uuid NOT NULL,
    "categoryId" text NOT NULL,
    amount numeric NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    note text,
    attachment text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- PASO 4: CREAR TABLA BUDGETS
-- ============================================================================
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
-- PASO 5: HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASO 6: CREAR POLÍTICAS RLS PARA TRANSACTIONS
-- ============================================================================
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

-- ============================================================================
-- PASO 7: CREAR POLÍTICAS RLS PARA ACCOUNTS
-- ============================================================================
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

-- ============================================================================
-- PASO 8: CREAR POLÍTICAS RLS PARA BUDGETS
-- ============================================================================
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

-- ============================================================================
-- PASO 9: CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);

-- ============================================================================
-- ¡LISTO! Ahora verifica que las tablas se crearon correctamente
-- ============================================================================
SELECT 'transactions' as tabla, COUNT(*) as columnas FROM information_schema.columns WHERE table_name = 'transactions'
UNION ALL
SELECT 'accounts', COUNT(*) FROM information_schema.columns WHERE table_name = 'accounts'
UNION ALL
SELECT 'budgets', COUNT(*) FROM information_schema.columns WHERE table_name = 'budgets';
