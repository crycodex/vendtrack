/**
 * En Vercel, applyEnv (Nitro) solo rellena `runtimeConfig.public.supabase.url|key`
 * desde NUXT_PUBLIC_SUPABASE_*; SUPABASE_URL / SUPABASE_KEY solas no mapean a esa ruta.
 * Si solo existen las variables legacy, las copiamos antes de `nuxt build` para que
 * el build embeba URL y clave correctas.
 */
import process from 'node:process'

if (process.env.SUPABASE_URL && !process.env.NUXT_PUBLIC_SUPABASE_URL) {
  process.env.NUXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL
}
if (!process.env.NUXT_PUBLIC_SUPABASE_KEY) {
  if (process.env.SUPABASE_KEY) {
    process.env.NUXT_PUBLIC_SUPABASE_KEY = process.env.SUPABASE_KEY
  } else if (process.env.SUPABASE_ANON_KEY) {
    process.env.NUXT_PUBLIC_SUPABASE_KEY = process.env.SUPABASE_ANON_KEY
  }
}
