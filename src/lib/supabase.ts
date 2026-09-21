import { createClient } from '@supabase/supabase-js'
export const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const supabase = url && key ? createClient(url, key) : null
export function db() {
  if (!supabase) throw new Error('Configurazione Supabase mancante. Consulta .env.example.')
  return supabase
}
