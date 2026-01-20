# 🔧 Guía de Configuración de Supabase

## Paso 1: Crear Cuenta en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en "Start your project"
3. Regístrate con tu cuenta de GitHub, Google, o email
4. Es **100% GRATIS** para empezar

---

## Paso 2: Crear un Nuevo Proyecto

1. Una vez dentro, haz clic en "New Project"
2. Completa los datos:
   - **Name**: `app-finanzas` (o el nombre que prefieras)
   - **Database Password**: Crea una contraseña segura (¡GUÁRDALA!)
   - **Region**: Selecciona la más cercana a ti (ejemplo: `South America (São Paulo)`)
   - **Pricing Plan**: Selecciona "Free" ($0/mes)
3. Haz clic en "Create new project"
4. Espera 1-2 minutos mientras se crea el proyecto

---

## Paso 3: Obtener las Credenciales

1. En el panel izquierdo, ve a **Settings** (⚙️) → **API**
2. Copia estos dos valores (los necesitarás después):
   - **Project URL** (algo como: `https://xxxxx.supabase.co`)
   - **anon public** key (una clave larga que empieza con `eyJ...`)

---

## Paso 4: Crear las Tablas de la Base de Datos

1. En el panel izquierdo, ve a **SQL Editor**
2. Haz clic en "+ New query"
3. Copia y pega el siguiente código SQL:

```sql
-- Tabla de Usuarios (extendida)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Cuentas
CREATE TABLE IF NOT EXISTS public.accounts (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    balance NUMERIC(15, 2) DEFAULT 0,
    color TEXT DEFAULT '#3498db',
    icon TEXT DEFAULT 'wallet',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Categorías
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT DEFAULT 'tag',
    color TEXT DEFAULT '#95a5a6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Transacciones
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    account_id TEXT REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount NUMERIC(15, 2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    to_account_id TEXT REFERENCES public.accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Configuración del Usuario
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    currency TEXT DEFAULT 'USD',
    theme TEXT DEFAULT 'light',
    language TEXT DEFAULT 'es',
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Presupuestos
CREATE TABLE IF NOT EXISTS public.budgets (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id TEXT REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    period TEXT NOT NULL, -- 'monthly', 'annual'
    month INTEGER, -- 1-12 para presupuestos mensuales
    year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (cada usuario solo ve sus propios datos)

-- User Profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Accounts
CREATE POLICY "Users can view own accounts" ON public.accounts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON public.accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON public.accounts
    FOR DELETE USING (auth.uid() = user_id);

-- Categories
CREATE POLICY "Users can view own categories" ON public.categories
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories
    FOR DELETE USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions
    FOR DELETE USING (auth.uid() = user_id);

-- User Settings
CREATE POLICY "Users can view own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Budgets
CREATE POLICY "Users can view own budgets" ON public.budgets
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON public.budgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON public.budgets
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON public.budgets
    FOR DELETE USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

4. Haz clic en "Run" (o presiona Ctrl+Enter)
5. Deberías ver el mensaje "Success. No rows returned"

---

## Paso 5: Configurar Autenticación

1. En el panel izquierdo, ve a **Authentication** → **Providers**
2. Asegúrate de que **Email** esté habilitado (viene habilitado por defecto)
3. Opcional: Puedes habilitar Google, GitHub, etc. para login social

---

## Paso 6: Configurar la Aplicación

1. Abre el archivo `config.json` en tu proyecto
2. Agrega tus credenciales de Supabase:

```json
{
  "supabase": {
    "url": "TU_PROJECT_URL_AQUI",
    "anonKey": "TU_ANON_KEY_AQUI"
  }
}
```

**Ejemplo:**
```json
{
  "supabase": {
    "url": "https://abcdefghijk.supabase.co",
    "anonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## ✅ ¡Listo!

Una vez completados estos pasos, tu aplicación estará lista para:
- 🔐 Autenticación de usuarios
- ☁️ Guardar datos en la nube
- 📱 Sincronizar entre dispositivos
- 🔄 Funcionar offline con sincronización automática

---

## 🆘 Solución de Problemas

### Error: "relation does not exist"
- Asegúrate de haber ejecutado el script SQL completo
- Verifica que estés en el proyecto correcto

### Error: "Invalid API key"
- Verifica que copiaste la clave **anon public** (no la service_role)
- Asegúrate de que no haya espacios extra al copiar

### No puedo ver mis tablas
- Ve a **Table Editor** en el panel izquierdo
- Deberías ver: accounts, categories, transactions, user_settings, budgets

---

## 📞 Soporte

Si tienes problemas, avísame y te ayudo a resolverlos paso a paso.
