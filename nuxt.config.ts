import { defineNuxtConfig } from 'nuxt/config'

/** Coincide con @nuxtjs/supabase: NUXT_PUBLIC_* es lo recomendado; el módulo solo inyecta por defecto SUPABASE_URL / SUPABASE_KEY. */
const supabaseUrl
  = process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey
  = process.env.NUXT_PUBLIC_SUPABASE_KEY
    || process.env.SUPABASE_KEY
    || process.env.SUPABASE_ANON_KEY

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/supabase'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  /** Alinea Nuxt UI (inputs, selects, modales) con el layout claro de la app */
  colorMode: {
    preference: 'light',
    fallback: 'light',
    classSuffix: '',
    storageKey: 'vendtrack-color-mode'
  },

  routeRules: {
    '/': { prerender: false }
  },

  compatibilityDate: '2025-01-15',

  /** Salida y rutas alineadas con Vercel (evita desajustes con el preset por defecto local). */
  nitro: {
    preset: 'vercel'
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  supabase: {
    redirect: false,
    url: supabaseUrl,
    key: supabaseKey
  }
})
