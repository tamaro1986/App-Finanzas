-- Verificar TODAS las columnas de la tabla investments
SELECT 
    column_name AS "Columna", 
    data_type AS "Tipo",
    is_nullable AS "Nullable",
    column_default AS "Default"
FROM information_schema.columns
WHERE table_name = 'investments'
ORDER BY ordinal_position;

-- Verificar que existan las columnas críticas
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investments' AND column_name = 'broker') 
        THEN '✅ broker existe'
        ELSE '❌ broker NO existe'
    END AS broker_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investments' AND column_name = 'asset_type') 
        THEN '✅ asset_type existe'
        ELSE '❌ asset_type NO existe'
    END AS asset_type_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investments' AND column_name = 'symbol') 
        THEN '✅ symbol existe'
        ELSE '❌ symbol NO existe'
    END AS symbol_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investments' AND column_name = 'quantity') 
        THEN '✅ quantity existe'
        ELSE '❌ quantity NO existe'
    END AS quantity_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investments' AND column_name = 'buy_price') 
        THEN '✅ buy_price existe'
        ELSE '❌ buy_price NO existe'
    END AS buy_price_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investments' AND column_name = 'current_price') 
        THEN '✅ current_price existe'
        ELSE '❌ current_price NO existe'
    END AS current_price_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investments' AND column_name = 'commission') 
        THEN '✅ commission existe'
        ELSE '❌ commission NO existe'
    END AS commission_status;
