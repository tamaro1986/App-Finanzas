-- ============================================================================
-- SCRIPT DEFINITIVO: Arreglar esquema de investments para sincronización
-- ============================================================================
-- Este script elimina TODOS los campos de tipo timestamp/date problemáticos
-- y asegura que la tabla solo tenga tipos compatibles con JavaScript

-- PASO 1: Ver estructura actual (para debugging)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'investments'
ORDER BY ordinal_position;

-- PASO 2: Eliminar TODOS los campos de tipo timestamp que puedan existir
-- Estos campos NO son usados por la aplicación y causan errores
ALTER TABLE public.investments 
DROP COLUMN IF EXISTS created_at CASCADE;

ALTER TABLE public.investments 
DROP COLUMN IF EXISTS updated_at CASCADE;

-- PASO 3: Asegurar que buy_date sea tipo TEXT (no date)
-- Primero verificar si existe y su tipo
DO $$ 
BEGIN
    -- Si buy_date existe y NO es text, convertirlo
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'investments' 
        AND column_name = 'buy_date'
        AND data_type != 'text'
    ) THEN
        -- Convertir a text
        ALTER TABLE public.investments 
        ALTER COLUMN buy_date TYPE text;
    END IF;
END $$;

-- PASO 4: Asegurar que last_update sea tipo BIGINT (no timestamp)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'investments' 
        AND column_name = 'last_update'
        AND data_type != 'bigint'
    ) THEN
        -- Convertir a bigint, manejando valores NULL
        ALTER TABLE public.investments 
        ALTER COLUMN last_update TYPE bigint 
        USING CASE 
            WHEN last_update IS NULL THEN NULL
            ELSE extract(epoch from last_update::timestamp)::bigint * 1000
        END;
    END IF;
END $$;

-- PASO 5: Verificar estructura final
SELECT 
    '✅ ESTRUCTURA FINAL' as status,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'investments'
ORDER BY ordinal_position;

-- PASO 6: Verificar que NO haya campos de tipo timestamp o date
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No hay campos problemáticos de tipo timestamp/date'
        ELSE '❌ ADVERTENCIA: Aún hay ' || COUNT(*) || ' campos de tipo timestamp/date'
    END as validation_result,
    string_agg(column_name || ' (' || data_type || ')', ', ') as problematic_fields
FROM information_schema.columns
WHERE table_name = 'investments'
AND (data_type LIKE '%timestamp%' OR data_type LIKE '%date%');
