-- ============================================================================
-- SCRIPT: CORREGIR TABLA VEHICLES
-- ============================================================================
-- PROPÓSITO: Actualizar la estructura de la tabla vehicles para que coincida
--            con la estructura de datos del frontend (Vehicles.jsx)
-- 
-- PROBLEMA: La tabla actual tiene campos incorrectos y falta la columna
--           maintenance_items (JSONB) que almacena los parámetros de mantenimiento
--
-- SOLUCIÓN: Recrear la tabla con la estructura correcta
-- ============================================================================

-- PASO 1: Eliminar tabla antigua (¡ADVERTENCIA! Esto borrará todos los datos)
DROP TABLE IF EXISTS public.vehicles CASCADE;

-- PASO 2: Crear nueva tabla con estructura correcta
CREATE TABLE public.vehicles (
    -- Identificadores
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Información básica del vehículo
    name text NOT NULL,                    -- Ej: "Toyota Hilux"
    plate text NOT NULL,                   -- Ej: "P-123456"
    type text NOT NULL DEFAULT 'Carro',    -- Ej: "Carro", "Moto"
    
    -- Kilometraje
    current_mileage integer NOT NULL DEFAULT 0,
    
    -- Parámetros de mantenimiento (CRÍTICO: debe ser JSONB)
    -- Estructura esperada: Array de objetos con:
    -- { id, label, last_mileage, interval, estimated_cost }
    maintenance_items jsonb NOT NULL DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- PASO 3: Habilitar Row Level Security (RLS)
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- PASO 4: Crear políticas RLS para seguridad de datos por usuario
-- Política 1: SELECT - Los usuarios solo pueden ver sus propios vehículos
CREATE POLICY "Users can view their own vehicles"
    ON public.vehicles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política 2: INSERT - Los usuarios solo pueden crear vehículos para sí mismos
CREATE POLICY "Users can insert their own vehicles"
    ON public.vehicles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política 3: UPDATE - Los usuarios solo pueden actualizar sus propios vehículos
CREATE POLICY "Users can update their own vehicles"
    ON public.vehicles
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Política 4: DELETE - Los usuarios solo pueden eliminar sus propios vehículos
CREATE POLICY "Users can delete their own vehicles"
    ON public.vehicles
    FOR DELETE
    USING (auth.uid() = user_id);

-- PASO 5: Crear índices para mejorar rendimiento de consultas
CREATE INDEX idx_vehicles_user_id ON public.vehicles(user_id);
CREATE INDEX idx_vehicles_type ON public.vehicles(type);
CREATE INDEX idx_vehicles_plate ON public.vehicles(plate);

-- ============================================================================
-- VERIFICACIÓN: Confirmar que la tabla se creó correctamente
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'vehicles'
ORDER BY ordinal_position;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- column_name         | data_type                   | is_nullable | column_default
-- --------------------+-----------------------------+-------------+------------------
-- id                  | uuid                        | NO          | gen_random_uuid()
-- user_id             | uuid                        | NO          | NULL
-- name                | text                        | NO          | NULL
-- plate               | text                        | NO          | NULL
-- type                | text                        | NO          | 'Carro'
-- current_mileage     | integer                     | NO          | 0
-- maintenance_items   | jsonb                       | NO          | '[]'::jsonb
-- created_at          | timestamp with time zone    | YES         | now()
-- updated_at          | timestamp with time zone    | YES         | now()
-- ============================================================================

-- ✅ ¡Script completado! La tabla vehicles ahora tiene la estructura correcta.
