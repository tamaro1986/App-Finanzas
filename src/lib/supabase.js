// ============================================================================
// CONFIGURACIÓN AUTOMÁTICA DE SUPABASE
// ============================================================================
// Este archivo carga las credenciales de Supabase automáticamente desde:
// 1. Variables de entorno (.env) - PRIORIDAD
// 2. localStorage - Si el usuario configuró manualmente
// 3. Valores por defecto - Como último recurso
// ============================================================================

import { createClient } from '@supabase/supabase-js'

// Cargar credenciales en orden de prioridad:
// 1. Variables de entorno (desde .env)
// 2. localStorage (configuración manual del usuario)
// 3. Valores por defecto (hardcoded)
const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    localStorage.getItem('supabase_url') ||
    'https://illzgrubrstyagmkqfju.supabase.co'

const supabaseAnonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    localStorage.getItem('supabase_key') ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsbHpncnVicnN0eWFnbWtxZmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNzA5ODksImV4cCI6MjA4Mzg0Njk4OX0.cUnAo_vB6wz6zwSUXrrkpj8w3Mp7EgKeBM3ZiDbHceQ'

// Logging para debugging (solo en desarrollo)
if (import.meta.env.DEV) {
    console.log('🔧 Supabase Configuration:')
    console.log('  URL Source:', import.meta.env.VITE_SUPABASE_URL ? '.env' : localStorage.getItem('supabase_url') ? 'localStorage' : 'default')
    console.log('  URL:', supabaseUrl)
    console.log('  Key Source:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '.env' : localStorage.getItem('supabase_key') ? 'localStorage' : 'default')
    console.log('  Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET')
}

// Crear cliente de Supabase si hay credenciales válidas
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        }
    })
    : null

// Función para actualizar configuración manualmente (desde Settings)
export const updateSupabaseConfig = (url, key) => {
    localStorage.setItem('supabase_url', url)
    localStorage.setItem('supabase_key', key)
    console.log('✅ Supabase configuration updated in localStorage')
    window.location.reload() // Reload to re-initialize client
}

// Función para obtener la configuración actual
export const getSupabaseConfig = () => ({
    url: supabaseUrl,
    keyPreview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET',
    source: import.meta.env.VITE_SUPABASE_URL ? 'Environment Variables (.env)' :
        localStorage.getItem('supabase_url') ? 'Manual Configuration (localStorage)' :
            'Default Values'
})

// Advertencia si no hay configuración
if (!supabase) {
    console.warn('⚠️ Supabase client not initialized. Please configure credentials.')
}
