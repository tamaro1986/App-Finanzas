-- ============================================================================
-- Script: Agregar columnas para funcionalidad de transferencias
-- Propósito: Agregar is_transfer y transfer_id a la tabla finanzas_transactions
-- Fecha: 2026-02-01
-- ============================================================================

-- Agregar columna is_transfer (boolean, por defecto false)
ALTER TABLE finanzas_transactions 
ADD COLUMN IF NOT EXISTS is_transfer BOOLEAN DEFAULT false;

-- Agregar columna transfer_id (UUID para vincular pares de transferencias)
ALTER TABLE finanzas_transactions 
ADD COLUMN IF NOT EXISTS transfer_id UUID;

-- Crear índice para mejorar búsquedas de transferencias vinculadas
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_id 
ON finanzas_transactions(transfer_id) 
WHERE transfer_id IS NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN finanzas_transactions.is_transfer IS 
'Indica si esta transacción es parte de una transferencia entre cuentas';

COMMENT ON COLUMN finanzas_transactions.transfer_id IS 
'UUID compartido entre las dos transacciones que componen una transferencia (expense + income)';

-- Verificar las columnas agregadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'finanzas_transactions'
AND column_name IN ('is_transfer', 'transfer_id')
ORDER BY column_name;
