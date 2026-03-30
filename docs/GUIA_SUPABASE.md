# 🗄️ Guía Rápida: Actualizar Supabase

## 📋 Pasos para Ejecutar el Script SQL

### **Paso 1: Abrir Supabase Dashboard**

1. Ve a: https://supabase.com/dashboard
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto: **App-Finanzas** (o el nombre que le hayas dado)

---

### **Paso 2: Abrir SQL Editor**

1. En el menú lateral izquierdo, busca el icono de **base de datos** 🗄️
2. Haz clic en **SQL Editor**
3. Verás un editor de código SQL

---

### **Paso 3: Crear Nueva Query**

1. Haz clic en **"New query"** o **"+ New query"**
2. Se abrirá un editor en blanco

---

### **Paso 4: Copiar el Script SQL**

1. Abre el archivo `supabase_setup.sql` en tu proyecto
2. **Selecciona TODO el contenido** (Ctrl+A)
3. **Copia** (Ctrl+C)

---

### **Paso 5: Pegar y Ejecutar**

1. **Pega** el contenido en el SQL Editor de Supabase (Ctrl+V)
2. Haz clic en **"Run"** o presiona **F5**
3. Espera a que se ejecute (puede tardar 10-30 segundos)

---

### **Paso 6: Verificar Resultados**

Deberías ver mensajes como:
```
✓ CREATE TABLE
✓ ALTER TABLE
✓ CREATE POLICY
✓ CREATE INDEX
```

Si ves errores, no te preocupes. Algunos errores son normales si las tablas ya existen.

---

### **Paso 7: Verificar Tablas Creadas**

1. Ve a **Table Editor** en el menú lateral
2. Deberías ver estas tablas:
   - ✅ `transactions`
   - ✅ `accounts`
   - ✅ `budgets`
   - ✅ `vehicles`
   - ✅ `medical_records`
   - ✅ `patients`
   - ✅ `journal_cbt`
   - ✅ `journal_health_log`
   - ✅ `journal_med_list`
   - ✅ `investments`

---

### **Paso 8: Verificar Políticas RLS**

1. Selecciona cualquier tabla (ej: `transactions`)
2. Ve a la pestaña **"Policies"**
3. Deberías ver 4 políticas:
   - ✅ Users can view own [tabla]
   - ✅ Users can insert own [tabla]
   - ✅ Users can update own [tabla]
   - ✅ Users can delete own [tabla]

---

## ✅ **Verificación Final**

### **Prueba en la Aplicación:**

1. Abre tu aplicación: `npm run dev`
2. Crea una transacción de prueba
3. Abre la consola del navegador (F12)
4. Busca: `✓ Data saved successfully to transactions`
5. Ve a Supabase Dashboard → Table Editor → `transactions`
6. Deberías ver tu transacción allí

---

## 🚨 **Solución de Problemas**

### **Error: "relation already exists"**
✅ **Normal** - Significa que la tabla ya existe. Puedes ignorarlo.

### **Error: "permission denied"**
❌ **Problema** - Verifica que estés usando el usuario correcto de Supabase.

### **Error: "syntax error"**
❌ **Problema** - Asegúrate de copiar TODO el contenido del archivo SQL.

### **No veo las tablas**
1. Refresca la página de Supabase
2. Verifica que estés en el proyecto correcto
3. Ve a SQL Editor y ejecuta:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

---

## 📝 **Comandos SQL Útiles**

### **Ver todas las tablas:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### **Ver políticas de una tabla:**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'transactions';
```

### **Verificar que RLS esté habilitado:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### **Contar registros en una tabla:**
```sql
SELECT COUNT(*) FROM transactions;
```

---

## 🎯 **Checklist de Verificación**

Marca cada item cuando lo completes:

- [ ] Abrí Supabase Dashboard
- [ ] Fui a SQL Editor
- [ ] Copié el contenido de `supabase_setup.sql`
- [ ] Pegué y ejecuté el script
- [ ] Vi mensajes de éxito (CREATE TABLE, etc.)
- [ ] Verifiqué que las tablas existen en Table Editor
- [ ] Verifiqué que las políticas RLS existen
- [ ] Probé crear una transacción en la app
- [ ] Verifiqué que la transacción aparece en Supabase

---

## ✨ **¡Listo!**

Si completaste todos los pasos del checklist, tu base de datos está configurada correctamente.

**Ahora tu aplicación debería:**
- ✅ Guardar datos en Supabase
- ✅ Sincronizar correctamente
- ✅ Mostrar notificaciones de éxito
- ✅ Persistir datos entre sesiones

---

## 🆘 **¿Necesitas Ayuda?**

Si tienes problemas:

1. Revisa la consola del navegador (F12) para ver errores
2. Verifica que las credenciales en `.env` sean correctas
3. Consulta `DIAGNOSTICO_SINCRONIZACION.md`
4. Toma capturas de pantalla de los errores

---

**¡Disfruta de tu aplicación con base de datos en la nube!** 🎉
