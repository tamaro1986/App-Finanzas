-- ============================================================================
-- PRUEBA: Insertar una inversión manualmente para detectar campos faltantes
-- ============================================================================

-- Primero, obtener tu user_id
SELECT 
    id as user_id,
    email
FROM auth.users
LIMIT 1;

-- Luego, intenta insertar una inversión de prueba con TODOS los campos
-- REEMPLAZA 'TU_USER_ID_AQUI' con el user_id que obtuviste arriba
INSERT INTO public.investments (
    id,
    user_id,
    broker,
    asset_type,
    symbol,
    name,
    quantity,
    buy_price,
    buy_date,
    buy_currency,
    commission,
    current_price,
    last_update,
    notes,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'TU_USER_ID_AQUI',  -- REEMPLAZA ESTO
    'GBM',
    'stock',
    'AAPL',
    'Apple Inc.',
    1.0,
    100.0,
    '2026-02-07',
    'USD',
    0.0,
    100.0,
    extract(epoch from now())::bigint * 1000,
    'Prueba de sincronización',
    now(),
    now()
);

-- Verificar que se insertó
SELECT * FROM public.investments ORDER BY created_at DESC LIMIT 1;
