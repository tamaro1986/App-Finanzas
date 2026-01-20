import { createClient } from '@supabase/supabase-js'

const supabaseUrl = localStorage.getItem('supabase_url') || 'https://illzgrubrstyagmkqfju.supabase.co'
const supabaseAnonKey = localStorage.getItem('supabase_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsbHpncnVicnN0eWFnbWtxZmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNzA5ODksImV4cCI6MjA4Mzg0Njk4OX0.cUnAo_vB6wz6zwSUXrrkpj8w3Mp7EgKeBM3ZiDbHceQ'

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const updateSupabaseConfig = (url, key) => {
    localStorage.setItem('supabase_url', url)
    localStorage.setItem('supabase_key', key)
    window.location.reload() // Reload to re-initialize client
}
