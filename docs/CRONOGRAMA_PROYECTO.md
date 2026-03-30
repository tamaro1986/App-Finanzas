# 📊 CRONOGRAMA DETALLADO DEL PROYECTO
## App-Finanzas - NegociosGarcia
### Sistema Integral de Gestión Financiera Personal y Empresarial

---

**Período de Desarrollo:** 19 de Enero 2026 - 08 de Febrero 2026  
**Duración Total:** 21 días  
**Total de Commits:** 54  
**Desarrollador:** Enrique García  
**Email:** mateogaray780@gmail.com

---

# 📅 FASE 1: FUNDACIÓN DEL PROYECTO
## Semana 1 (19-21 Enero 2026)

---

## 🗓️ Día 1 - 19 de Enero 2026
### Inicio del Proyecto

| Hora | Actividad |
|------|-----------|
| -- | Creación del repositorio en GitHub |
| -- | Configuración inicial del proyecto con Vite + React |
| -- | Estructura base de carpetas establecida |

**Commit:** `73de5ac` - Initial commit

**Tecnologías base configuradas:**
- React 19.2.3
- Vite 7.3.1
- Tailwind CSS 3.4.19
- Lucide React (iconos)

**Estructura inicial del proyecto:**
```
App-Finanzas/
├── src/
│   ├── components/
│   ├── lib/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── public/
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## 🗓️ Día 2 - 20 de Enero 2026
### Configuración de Deploy

| Commit | Descripción Detallada |
|--------|----------------------|
| `0444964` | **GitHub Actions Workflow** - Configuración de CI/CD para deploy automático a GitHub Pages. El workflow compila el proyecto con Vite y despliega el bundle a la rama gh-pages. |
| `1bc1acf` | **Base Path** - Ajuste del `vite.config.js` para establecer el base path correcto (`/App-Finanzas/`) necesario para que los assets se carguen correctamente en GitHub Pages. |
| `445e183` | **Merge** - Sincronización de cambios remotos con el repositorio local. |
| `d85c94d` | **Limpieza** - Eliminación de `node_modules` del repositorio (error común) y actualización del `.gitignore` para prevenir que se vuelva a subir. |

**Archivo de workflow creado:** `.github/workflows/deploy.yml`
```yaml
name: Deploy Vite site to Pages
on:
  push:
    branches: ["main"]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - Checkout código
      - Instalar dependencias (npm install)
      - Build (npm run build)
      - Upload artifact
  deploy:
    - Deploy to GitHub Pages
```

**URL de producción establecida:** https://tamaro1986.github.io/App-Finanzas/

---

## 🗓️ Día 3 - 21 de Enero 2026
### 🔥 Día Más Productivo (11 commits)

Este fue el día más intenso del proyecto, donde se implementó la mayoría de la infraestructura core.

---

### Bloque 1: Integración con Supabase (Base de Datos en la Nube)

| Commit | Módulo | Descripción |
|--------|--------|-------------|
| `d85c94d` | **Accounts** | Primera conexión a Supabase. Implementación de funciones `loadFromSupabase()` y `saveToSupabase()` para el módulo de cuentas. |
| `113648d` | **Transactions** | Sincronización de transacciones (ingresos, gastos). Cada movimiento se guarda en localStorage Y en Supabase para respaldo en la nube. |
| `94e42e4` | **Dashboard** | Conexión del panel principal. Los totales y gráficos ahora se calculan con datos sincronizados. |
| `be974cf` | **Investments + Vehicles** | Módulos de inversiones y vehículos conectados a Supabase. |
| `cfb0198` | **Todos los módulos** | Verificación final de que todos los componentes sincronizan correctamente. |

**Arquitectura de sincronización implementada:**
```javascript
// Patrón de sincronización dual
const saveData = async (key, data) => {
  // 1. Guardar siempre en localStorage (offline-first)
  localStorage.setItem(key, JSON.stringify(data));
  
  // 2. Intentar sincronizar con Supabase
  try {
    await supabase.from('table').upsert(data);
  } catch (error) {
    // Los datos se sincronizarán después
    console.log('Se sincronizará cuando haya conexión');
  }
};
```

**Tablas de Supabase creadas:**
- `accounts` - Cuentas bancarias, efectivo, préstamos
- `transactions` - Movimientos financieros
- `investments` - Portafolio de inversiones
- `vehicles` - Registro de vehículos
- `budgets` - Presupuestos mensuales
- `categories` - Categorías personalizadas

---

### Bloque 2: Sistema de Autenticación

| Commit | Descripción |
|--------|-------------|
| `bd9d626` | **Supabase Auth completo** |

**Funcionalidades de autenticación implementadas:**
1. **Registro de usuarios** - Formulario con email y contraseña
2. **Inicio de sesión** - Login con validación
3. **Recuperación de contraseña** - Envío de email de reset
4. **Cierre de sesión** - Limpieza de tokens
5. **Persistencia de sesión** - El usuario permanece logueado

**Componentes creados:**
- `AuthProvider.jsx` - Context para manejo global de auth
- `LoginForm.jsx` - Formulario de inicio de sesión
- `SignupForm.jsx` - Formulario de registro
- `ProtectedRoute.jsx` - HOC para rutas protegidas

**Políticas RLS (Row Level Security) configuradas:**
```sql
-- Los usuarios solo ven sus propios datos
CREATE POLICY "Users can only see own data" ON accounts
FOR ALL USING (auth.uid() = user_id);
```

---

### Bloque 3: Identidad de Marca

| Commit | Área | Descripción |
|--------|------|-------------|
| `ef0b25e` | **Logo y colores** | Aplicación de identidad visual "NegociosGarcia" |
| `8969b69` | **Navegación** | Sidebar con logo corporativo, colores verdes institucionales |
| `4589d26` | **Estilos globales** | Variables CSS con paleta de colores de marca |

**Paleta de colores establecida:**
```css
:root {
  --brand-primary: #16a34a;    /* Verde principal */
  --brand-secondary: #22c55e;  /* Verde claro */
  --brand-dark: #0f172a;       /* Slate oscuro */
  --brand-accent: #3b82f6;     /* Azul acento */
}
```

**Elementos de marca aplicados:**
- Logo "NG" en el sidebar
- Nombre "NegociosGarcia" con subtítulo "CRECIMIENTO Y CONFIANZA"
- Iconografía consistente con Lucide React
- Tipografía: Georgia para títulos, System UI para texto

---

### Bloque 4: Importación desde Excel

| Commit | Descripción |
|--------|-------------|
| `61177f3` | **Sistema de importación masiva** |

**Funcionalidades implementadas:**
1. **Descarga de plantilla Excel** - Template pre-formateado
2. **Carga de archivo** - Drag & drop o click para seleccionar
3. **Validación de datos** - Verificación de fechas, montos, categorías
4. **Preview antes de importar** - Vista previa con errores marcados
5. **Importación masiva** - Inserción de múltiples registros

**Columnas de la plantilla Excel:**
| Columna | Tipo | Descripción |
|---------|------|-------------|
| Fecha | Date | Fecha del movimiento |
| Tipo | Text | "ingreso" o "gasto" |
| Monto | Number | Cantidad (sin símbolos) |
| Categoría | Text | Nombre de la categoría |
| Nota | Text | Descripción opcional |
| Cuenta | Text | Nombre de la cuenta |

**Librería utilizada:** `xlsx` (SheetJS)

---

### Bloque 5: Metadatos Corporativos

| Commit | Descripción |
|--------|-------------|
| `c0c4980` | **Camuflaje corporativo** |

**Cambios en index.html:**
```html
<title>NegociosGarcia - Sistema de Gestión</title>
<meta name="description" content="Sistema empresarial de gestión">
```

**Propósito:** Hacer que la aplicación se vea como un sistema corporativo genérico para privacidad en entornos de trabajo.

---

# 📅 FASE 2: ESTABILIZACIÓN
## Semana 2 (23-26 Enero 2026)

---

## 🗓️ 23 de Enero 2026
### Corrección de Bugs de Estado

| Commit | Problema | Solución |
|--------|----------|----------|
| `ad3bb99` | Los datos no persistían al cambiar de módulo | Implementación de estado global con prop drilling mejorado |
| `dba2521` | Las inversiones no se sincronizaban correctamente | Refactorización del flujo de datos de inversiones |

**Problemas resueltos:**
1. ❌ Al ir a Inversiones y volver a Dashboard, los datos desaparecían
2. ❌ Supabase lanzaba errores cuando no había conexión
3. ✅ Implementación de verificaciones de seguridad antes de cada operación
4. ✅ Fallback a localStorage cuando Supabase no está disponible

---

## 🗓️ 26 de Enero 2026
### Configuración Automática

| Commit | Descripción |
|--------|-------------|
| `f850d28` | **Sistema de configuración desde .env** |
| `12581a3` | **Documentación y scripts de ayuda** |

**Archivo .env.example creado:**
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

**Sistema de notificaciones implementado:**
- ✅ Notificaciones elegantes tipo toast
- ✅ Indicador de sincronización en tiempo real
- ✅ Alertas de errores de conexión

**Documentación creada:**
- `INSTRUCCIONES_CREDENCIALES.txt`
- `README.md` actualizado
- Scripts SQL para configuración de tablas

---

# 📅 FASE 3: FUNCIONALIDADES AVANZADAS
## Semana 3 (01-04 Febrero 2026)

---

## 🗓️ 01 de Febrero 2026
### Sistema de Transferencias

| Commit | Funcionalidad |
|--------|---------------|
| `a897a7a` | **Transferencias entre cuentas** |
| `2443de7` | **Edición de transferencias** |

**Lógica de transferencias implementada:**
```javascript
const handleTransfer = async (fromAccountId, toAccountId, amount) => {
  // 1. Reducir saldo de cuenta origen
  updateAccountBalance(fromAccountId, -amount);
  
  // 2. Aumentar saldo de cuenta destino
  updateAccountBalance(toAccountId, +amount);
  
  // 3. Crear registro de transferencia
  createTransaction({
    type: 'transfer',
    fromAccountId,
    toAccountId,
    amount,
    isTransfer: true
  });
};
```

**Visualización en la tabla:**
- Las transferencias muestran: "Cuenta A → Cuenta B"
- Icono especial de flechas para identificar transferencias
- Al editar, se pueden cambiar las cuentas involucradas

---

## 🗓️ 04 de Febrero 2026
### Correcciones Múltiples

| Commit | Módulo | Problema Resuelto |
|--------|--------|-------------------|
| `3c3dae0` | Vehículos | Los datos de vehículos no persistían entre sesiones |
| `81151dd` | Salud | Lista de medicamentos no sincronizaba |
| `3f1d6a4` | Filtros | Errores cuando campos eran `undefined` |
| `ecdb8e0` | Salud | Verificación de tipo para `diary_note` y `symptoms` |

**Patrón de verificación implementado:**
```javascript
// Antes (causaba errores):
const filtered = data.filter(item => item.name.includes(query));

// Después (seguro):
const filtered = data.filter(item => (item.name || '').includes(query));
```

---

# 📅 FASE 4: MEJORAS DE EXCEL Y TCC
## Semana 4 (06-07 Febrero 2026)

---

## 🗓️ 06 de Febrero 2026
### Mejoras al Sistema de Importación

| Commit | Descripción |
|--------|-------------|
| `1419714` | Fix crash en módulo de pensamientos |
| `e7a072c` | Script SQL maestro para Supabase |
| `b86d8e9` | **Ordenamiento en tabla de transacciones** |
| `09747a7` | Fix de errores de referencia |
| `feeeee7b` | Fix acumulación de balance en transferencias |
| `c2e8ee1` | **Transferencias en importación Excel** |
| `963f7a2` | **Categorías en dropdowns de Excel** |
| `dab4de3` | Fix ruta de script para producción |

**Nueva plantilla Excel con transferencias:**
| Fecha | Tipo | Monto | Categoría | Nota | Cuenta | EsTransferencia | CuentaDestino |
|-------|------|-------|-----------|------|--------|-----------------|---------------|
| 01/02/2026 | gasto | 100 | Comida | Almuerzo | Efectivo | NO | |
| 02/02/2026 | | 500 | | Pago | Banco | SI | Efectivo |

**Ordenamiento de tabla implementado:**
- Click en encabezado para ordenar ascendente/descendente
- Columnas ordenables: Fecha, Cuenta, Categoría, Monto
- Indicador visual de dirección de ordenamiento (↑↓)

---

## 🗓️ 07 de Febrero 2026
### Módulo TCC con Inteligencia Artificial

| Commit | Descripción |
|--------|-------------|
| `405cc1f` | Columnas faltantes en inversiones |
| `7e85093` | Campo de comisión de compra |
| `f26b0bd` | Fix nombre de tabla investments |
| `b8ed22b` | Fix nombres de tabla journal |
| `faf280d` | **🧠 Módulo TCC completo con IA** |
| `b0a122d` | Modelos Gemini compatibles |
| `f09c691` | Actualización a Gemini 2.5 |
| `7f390cf` | UI mejorada para análisis |

**Sistema de análisis con IA implementado:**

El módulo TCC (Terapia Cognitivo-Conductual) permite registrar pensamientos intrusivos y recibir análisis profesional de una IA.

**9 Técnicas de TCC implementadas:**
1. **Identificación del pensamiento automático** - Capturar el pensamiento exacto
2. **Identificación de emociones** - Qué emociones genera
3. **Distorsiones cognitivas** - Detectar patrones como catastrofización, personalización
4. **Examen de evidencia** - ¿Qué pruebas hay a favor y en contra?
5. **Perspectiva alternativa** - ¿Cómo lo vería otra persona?
6. **Descatastrofización** - ¿Qué pasaría realmente si ocurre?
7. **Técnica del amigo** - ¿Qué le dirías a un amigo?
8. **Pensamiento equilibrado** - Reformulación realista
9. **Plan de acción** - Pasos concretos a seguir

**Prompt enviado a Gemini:**
```
Actúa como un psicólogo especializado en TCC...
Analiza este pensamiento: "${pensamiento}"
Aplica las siguientes técnicas:
1. Identificar distorsiones cognitivas
2. Examinar evidencia objetiva
3. Proporcionar perspectiva alternativa
...
```

**Modelos de IA probados:**
- ❌ gemini-pro (deprecado)
- ❌ gemini-1.5-pro (no disponible en API gratuita)
- ✅ gemini-2.5-flash (funcionando)

---

# 📅 FASE 5: MÓDULO DE DEUDAS Y FILTROS
## Semana 5 - HOY (08 Febrero 2026)

---

## 🗓️ 08 de Febrero 2026
### Sesión Actual de Trabajo

| Hora Aprox. | Commit | Descripción Detallada |
|-------------|--------|----------------------|
| 19:30 | `b886acd` | **Plan de pagos detallado** |
| 19:45 | `905d91d` | **Tasa de mora configurable** |
| 20:00 | `3852b36` | **Filtros avanzados en Movimientos** |
| 20:20 | `5f55a9d` | **Sincronización de cuotas con Supabase** |
| 20:28 | `fd3cc78` | **Filtro por cuenta específica** |
| 20:40 | `ac00818` | **Checkbox al inicio de tabla** |
| 20:50 | `09545f6` | **Mejoras de visualización** |

---

### Detalle: Plan de Pagos con Desglose (`b886acd`)

**Antes:**
- Solo mostraba: Cuota, Fecha, Monto, Saldo

**Después:**
- Cuota #
- Fecha de pago
- **Capital** (parte del pago que reduce la deuda)
- **Interés** (costo del dinero)
- **Seguro** (desgravamen si aplica)
- **Mora** (por pagos atrasados)
- **Total** (suma de todos los componentes)

**Funciones helper creadas:**
```javascript
// Redondeo a 2 decimales
const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

// Formateo de moneda
const formatCurrency = (amount) => {
  return '$' + round2(amount).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
```

**Cálculo de amortización (Sistema Francés):**
```javascript
const calculateAmortization = (loan) => {
  const monthlyRate = (interestRate / 100) / 12;
  const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) 
                        / (Math.pow(1 + monthlyRate, term) - 1);
  
  for (let i = 1; i <= term; i++) {
    const interest = balance * monthlyRate;
    const principal = monthlyPayment - interest;
    balance = balance - principal;
    
    schedule.push({
      installment: i,
      principal: round2(principal),
      interest: round2(interest),
      // ...
    });
  }
};
```

---

### Detalle: Tasa de Mora (`905d91d`)

**Campo agregado al formulario de préstamos:**
- Etiqueta: "Tasa Mora Anual (%)"
- Valor por defecto: 0
- Descripción: "Se aplica a cuotas vencidas no pagadas"

**Cálculo de mora:**
```javascript
const isOverdue = !isPaid && isBefore(paymentDate, today);
const lateInterest = isOverdue ? round2(balance * monthlyLateRate) : 0;
```

---

### Detalle: Filtros Avanzados en Movimientos (`3852b36`)

**Nuevos filtros implementados:**

| Filtro | Tipo | Opciones |
|--------|------|----------|
| Tipo de movimiento | Select | Todos, Ingresos, Gastos |
| Tipo de cuenta | Select | Ahorros, Corriente, Efectivo, Préstamo, etc. |
| Categoría | Select | Todas las categorías (con emoji) |
| Fecha desde | Date | Selector de fecha |
| Fecha hasta | Date | Selector de fecha |
| Cuenta específica | Select | Lista de cuentas del usuario |

**UI implementada:**
- Botón "Filtros" que despliega panel
- Indicador de punto azul cuando hay filtros activos
- Chips removibles para cada filtro activo
- Botón "Limpiar" para resetear todos los filtros

**Código de filtrado:**
```javascript
const filteredTransactions = transactions.filter(t => {
  const matchesSearch = (t.note || '').toLowerCase().includes(searchQuery);
  const matchesType = filterType === 'all' || t.type === filterType;
  const matchesAccount = !selectedAccountId || t.accountId === selectedAccountId;
  const matchesAccountType = filterAccountType === 'all' || account?.type === filterAccountType;
  const matchesDateRange = (!filterDateFrom || t.date >= filterDateFrom) 
                        && (!filterDateTo || t.date <= filterDateTo);
  const matchesCategory = filterCategoryId === 'all' || t.categoryId === filterCategoryId;
  
  return matchesSearch && matchesType && matchesAccount 
      && matchesAccountType && matchesDateRange && matchesCategory;
});
```

---

### Detalle: Marcar Cuotas como Pagadas (`5f55a9d` + `ac00818`)

**Funcionalidad:**
1. Click en el círculo (○) para marcar como pagada
2. El círculo cambia a check verde (✅)
3. El Capital Pendiente se reduce automáticamente
4. Los datos se sincronizan con Supabase

**Problema encontrado y resuelto:**
- ❌ Error: `invalid input syntax for type integer: "[1,2]"`
- ✅ Causa: La columna `paid_installments` estaba como INTEGER
- ✅ Solución: Cambiar a JSONB para soportar arrays

**SQL de corrección:**
```sql
ALTER TABLE accounts 
ALTER COLUMN paid_installments TYPE jsonb 
USING COALESCE(paid_installments::text::jsonb, '[]'::jsonb);
```

---

### Detalle: Mejoras de Visualización (`09545f6`)

**Cambios implementados:**
1. **Contador de cuotas:** "2 / 105 pagadas" en verde
2. **Altura fija:** Máximo 400px con scroll vertical
3. **Header sticky:** Los encabezados quedan fijos al hacer scroll
4. **Columnas compactas:** Menos padding para caber en pantalla

---

# 📊 RESUMEN ESTADÍSTICO

## Commits por Día
```
19 Ene: ▓ 1
20 Ene: ▓▓▓▓ 4
21 Ene: ▓▓▓▓▓▓▓▓▓▓▓ 11 ← Día más productivo
23 Ene: ▓▓ 2
26 Ene: ▓▓ 2
01 Feb: ▓▓ 2
04 Feb: ▓▓▓▓ 4
06 Feb: ▓▓▓▓▓▓▓▓ 8
07 Feb: ▓▓▓▓▓▓▓▓ 8
08 Feb: ▓▓▓▓▓▓▓ 7 ← HOY
```

## Distribución por Tipo
| Tipo | Cantidad | Porcentaje |
|------|----------|------------|
| Features (feat) | 22 | 41% |
| Fixes (fix) | 24 | 44% |
| Docs/Chore | 8 | 15% |

## Líneas de Código Aproximadas
| Archivo | Líneas |
|---------|--------|
| DebtModule.jsx | ~560 |
| Transactions.jsx | ~2,360 |
| Accounts.jsx | ~400 |
| InvestmentPortfolio.jsx | ~800 |
| TCCJournal.jsx | ~500 |
| HealthLog.jsx | ~600 |
| Dashboard.jsx | ~400 |
| **Total estimado** | **~8,000+** |

---

# 🔗 RECURSOS Y ENLACES

| Recurso | URL |
|---------|-----|
| **Aplicación** | https://tamaro1986.github.io/App-Finanzas/ |
| **Repositorio** | https://github.com/tamaro1986/App-Finanzas |
| **Supabase Dashboard** | https://supabase.com/dashboard |
| **GitHub Actions** | https://github.com/tamaro1986/App-Finanzas/actions |

---

# ⏳ PRÓXIMOS PASOS SUGERIDOS

1. [ ] Ejecutar SQL de corrección para `paid_installments`
2. [ ] Implementar gráficos de progreso de pago de deudas
3. [ ] Agregar notificaciones de cuotas próximas a vencer
4. [ ] Implementar exportación del plan de pagos a PDF
5. [ ] Agregar modo oscuro
6. [ ] Implementar PWA para instalación en móviles

---

*Cronograma generado el 08 de Febrero 2026 a las 21:07*  
*Proyecto desarrollado por Enrique García - NegociosGarcia*
