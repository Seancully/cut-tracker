import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasConfig = Boolean(url && key && !url.includes('YOUR-PROJECT'))

// If env isn't set yet the app still loads and shows a friendly setup message
// instead of crashing.
export const supabase = hasConfig ? createClient(url, key) : null

// Helper: today's date as YYYY-MM-DD in LOCAL time (not UTC).
export function todayStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}
