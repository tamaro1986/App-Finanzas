-- ============================================================================
-- MIGRACIÓN: Actualizar tabla medical_records para que coincida con la app
-- ============================================================================

-- Agregar columnas faltantes
ALTER TABLE public.medical_records 
ADD COLUMN IF NOT EXISTS person_name text,
ADD COLUMN IF NOT EXISTS reason text,
ADD COLUMN IF NOT EXISTS doctor_name text,
ADD COLUMN IF NOT EXISTS doctor_comments text,
ADD COLUMN IF NOT EXISTS height numeric,
ADD COLUMN IF NOT EXISTS weight numeric,
ADD COLUMN IF NOT EXISTS recipe_image text,
ADD COLUMN IF NOT EXISTS audio_note text,
ADD COLUMN IF NOT EXISTS has_follow_up boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS follow_up_date date,
ADD COLUMN IF NOT EXISTS medications_list jsonb;

-- Verificar las columnas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'medical_records' 
ORDER BY ordinal_position;
