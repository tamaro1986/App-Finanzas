# Guía de Diagnóstico y Solución de Problemas de Sincronización

## Problema: Los datos se guardan temporalmente pero luego se borran

### Causas Comunes y Soluciones

#### 1. **Error de Autenticación**
**Síntoma:** Los datos aparecen pero desaparecen al recargar la página.

**Diagnóstico:**
- Abre la consola del navegador (F12)
- Busca mensajes como: `No user authenticated - data saved locally only`

**Solución:**
- Verifica que estés autenticado correctamente
- Cierra sesión y vuelve a iniciar sesión
- Verifica que tu sesión de Supabase no haya expirado

#### 2. **Problemas de Conexión a Supabase**
**Síntoma:** Mensaje de advertencia: "La transacción se guardó solo en este dispositivo"

**Diagnóstico:**
- Revisa la consola del navegador
- Busca errores que contengan: `⚠️ Error syncing to Supabase`
- Verifica el código de error (ej: `code: "PGRST116"`, `code: "42501"`)

**Soluciones:**

a) **Error de permisos (42501):**
   - Ve a Supabase Dashboard → Authentication → Policies
   - Asegúrate de que las políticas RLS (Row Level Security) permitan:
     - INSERT para usuarios autenticados
     - UPDATE para usuarios autenticados
     - SELECT para usuarios autenticados
     - DELETE para usuarios autenticados

b) **Error de tabla no encontrada (PGRST116):**
   - Ve a Supabase Dashboard → Table Editor
   - Verifica que existan las siguientes tablas:
     - `transactions`
     - `accounts`
     - `budgets`
   - Cada tabla debe tener una columna `user_id` de tipo `uuid`

c) **Credenciales incorrectas:**
   - Ve a Settings en la aplicación
   - Verifica que la URL y la API Key de Supabase sean correctas
   - Obtén las credenciales correctas desde: Supabase Dashboard → Settings → API

#### 3. **Problemas con Row Level Security (RLS)**
**Síntoma:** Error `new row violates row-level security policy`

**Solución:**
1. Ve a Supabase Dashboard → Authentication → Policies
2. Para cada tabla (`transactions`, `accounts`, etc.), crea estas políticas:

**Política SELECT:**
```sql
CREATE POLICY "Users can view own data"
ON [nombre_tabla]
FOR SELECT
USING (auth.uid() = user_id);
```

**Política INSERT:**
```sql
CREATE POLICY "Users can insert own data"
ON [nombre_tabla]
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Política UPDATE:**
```sql
CREATE POLICY "Users can update own data"
ON [nombre_tabla]
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

**Política DELETE:**
```sql
CREATE POLICY "Users can delete own data"
ON [nombre_tabla]
FOR DELETE
USING (auth.uid() = user_id);
```

#### 4. **Estructura de Tabla Incorrecta**
**Síntoma:** Error `column "user_id" does not exist`

**Solución:**
Asegúrate de que cada tabla tenga la siguiente estructura mínima:

**Tabla `transactions`:**
```sql
CREATE TABLE transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    account_id uuid NOT NULL,
    category_id text NOT NULL,
    amount numeric NOT NULL,
    type text NOT NULL,
    note text,
    attachment text,
    created_at timestamp with time zone DEFAULT now()
);
```

**Tabla `accounts`:**
```sql
CREATE TABLE accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL,
    balance numeric DEFAULT 0,
    color text,
    created_at timestamp with time zone DEFAULT now()
);
```

#### 5. **Problemas de Red**
**Síntoma:** Notificación: "Verifica tu conexión a internet"

**Solución:**
- Verifica que tengas conexión a internet
- Intenta acceder a Supabase Dashboard para verificar que el servicio esté funcionando
- Verifica que no haya un firewall bloqueando la conexión

### Cómo Verificar el Estado de Sincronización

1. **Abre la Consola del Navegador (F12)**
2. **Ve a la pestaña Console**
3. **Busca estos mensajes:**
   - ✅ `✓ Data saved successfully to [tabla]` → Todo bien
   - ⚠️ `⚠️ ADVERTENCIA: Los datos se guardaron SOLO LOCALMENTE` → Problema de sincronización
   - ❌ `⚠️ Error syncing to Supabase` → Error crítico

### Verificar Datos en Supabase

1. Ve a Supabase Dashboard
2. Selecciona tu proyecto
3. Ve a Table Editor
4. Selecciona la tabla `transactions` o `accounts`
5. Verifica que los datos estén allí
6. Si no hay datos, el problema es de sincronización

### Solución Rápida: Forzar Sincronización

Si los datos están solo en localStorage:

1. Abre la consola del navegador (F12)
2. Ve a la pestaña Application → Local Storage
3. Verifica que existan las keys:
   - `finanzas_transactions`
   - `finanzas_accounts`
4. Si existen, el problema es que no se están sincronizando con Supabase

### Contacto de Soporte

Si ninguna de estas soluciones funciona:

1. Abre la consola del navegador (F12)
2. Copia todos los mensajes de error
3. Toma una captura de pantalla de:
   - Los errores en la consola
   - La configuración de Supabase (Settings)
   - Las políticas RLS en Supabase Dashboard
4. Proporciona esta información para obtener ayuda específica

### Mejoras Implementadas

✅ **Mejor manejo de errores:** Ahora la aplicación detecta y reporta errores de sincronización
✅ **Notificaciones elegantes:** Reemplazamos las alertas nativas con notificaciones toast
✅ **Logging detallado:** Todos los errores se registran en la consola con información útil
✅ **Guardado local como backup:** Los datos siempre se guardan en localStorage primero
✅ **Feedback visual:** El usuario sabe exactamente cuándo hay problemas de sincronización
