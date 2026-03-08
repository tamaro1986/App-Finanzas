-- SQL Migration: Add product type and unit of measure to business module
ALTER TABLE finanzas_business_products 
ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'producto_terminado' CHECK (product_type IN ('materia_prima', 'producto_terminado')),
ADD COLUMN IF NOT EXISTS unit_of_measure TEXT DEFAULT 'unidades';

-- Update existing records if any
UPDATE finanzas_business_products SET product_type = 'producto_terminado' WHERE product_type IS NULL;
