-- ============================================================================
-- CORRECCIÓN DE TABLA: investments
-- PROPÓSITO: Agregar columnas faltantes para sincronización correcta
-- PROBLEMA: La tabla investments no tiene las columnas que el código envía
-- ============================================================================

-- Agregar columnas faltantes a la tabla investments
ALTER TABLE public.investments 
ADD COLUMN IF NOT EXISTS broker text,
ADD COLUMN IF NOT EXISTS asset_type text,
ADD COLUMN IF NOT EXISTS symbol text,
ADD COLUMN IF NOT EXISTS buy_currency text DEFAULT 'USD';

-- Renombrar columna 'type' a 'asset_type' si existe (para evitar conflictos)
-- La columna 'type' ya existe pero debería llamarse 'asset_type'
DO $$ 
BEGIN 
  -- Si existe la columna 'type' y NO existe 'asset_type', renombrarla
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'investments' AND column_name = 'type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'investments' AND column_name = 'asset_type'
  ) THEN
    ALTER TABLE public.investments RENAME COLUMN type TO asset_type;
  END IF;
END $$;

-- ============================================================================
-- VERIFICACIÓN: Mostrar estructura completa de la tabla investments
-- ============================================================================
SELECT 
    '📊 ESTRUCTURA DE LA TABLA INVESTMENTS' as info;

SELECT 
    column_name AS "Columna", 
    data_type AS "Tipo de Dato",
    is_nullable AS "Permite NULL",
    column_default AS "Valor por Defecto"
FROM information_schema.columns
WHERE table_name = 'investments'
ORDER BY ordinal_position;

-- ============================================================================
-- EXPLICACIÓN DE COLUMNAS
-- ============================================================================
SELECT 
    '✅ COLUMNAS REQUERIDAS PARA SINCRONIZACIÓN' as info;

SELECT 
    'id' as columna,
    'UUID único de la inversión' as descripcion
UNION ALL
SELECT 'user_id', 'ID del usuario (auth.users)'
UNION ALL
SELECT 'broker', '🆕 Nombre del broker (GBM, Bitso, etc.)'
UNION ALL
SELECT 'asset_type', '🆕 Tipo de activo (stock, crypto, etf, bond, other)'
UNION ALL
SELECT 'symbol', '🆕 Símbolo del activo (AAPL, BTC, TSLA, etc.)'
UNION ALL
SELECT 'name', 'Nombre descriptivo del activo'
UNION ALL
SELECT 'quantity', 'Cantidad de unidades (permite fracciones)'
UNION ALL
SELECT 'buy_price', 'Precio de compra por unidad'
UNION ALL
SELECT 'buy_date', 'Fecha de compra'
UNION ALL
SELECT 'buy_currency', '🆕 Moneda de compra (USD, MXN, EUR)'
UNION ALL
SELECT 'current_price', 'Precio actual por unidad'
UNION ALL
SELECT 'last_update', 'Timestamp de última actualización de precio'
UNION ALL
SELECT 'notes', 'Notas adicionales'
UNION ALL
SELECT 'created_at', 'Fecha de creación del registro'
UNION ALL
SELECT 'updated_at', 'Fecha de última modificación';

-- ============================================================================
-- CÁLCULOS QUE SE MOSTRARÁN EN LA INTERFAZ
-- ============================================================================
SELECT 
    '💰 CÁLCULOS EN LA TABLA DE INVERSIONES' as info;

SELECT 
    'Costo Total' as calculo,
    'buy_price × quantity' as formula,
    'Inversión total realizada' as descripcion
UNION ALL
SELECT 
    'Valor Actual',
    'current_price × quantity',
    'Valor actual de la inversión'
UNION ALL
SELECT 
    'P&L (Ganancia/Pérdida)',
    '(current_price - buy_price) × quantity',
    'Ganancia o pérdida en dinero'
UNION ALL
SELECT 
    'ROI (Retorno)',
    '((current_price - buy_price) / buy_price) × 100',
    'Retorno de inversión en porcentaje';

-- Mensaje de confirmación
SELECT '✅ Tabla investments actualizada correctamente. Ahora tiene todas las columnas necesarias.' as status;

