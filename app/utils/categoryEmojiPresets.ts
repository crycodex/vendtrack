/** Valor interno del filtro «todas las categorías» (no usar '' en ComboboxItem). */
export const CATEGORY_EMOJI_FILTER_ALL = '__vendtrack_all_categories__'

/** Emojis sugeridos al crear categorías (filtrado rápido en catálogo). */
export const CATEGORY_EMOJI_PRESETS = [
  { emoji: '🥤', label: 'Bebidas' },
  { emoji: '☕', label: 'Café / caliente' },
  { emoji: '🍫', label: 'Snacks / dulces' },
  { emoji: '🥪', label: 'Comida' },
  { emoji: '🧃', label: 'Jugos' },
  { emoji: '🍿', label: 'Snacks salados' },
  { emoji: '🧊', label: 'Frío / helados' },
  { emoji: '💊', label: 'Salud' },
  { emoji: '🧴', label: 'Higiene' },
  { emoji: '📦', label: 'General' },
  { emoji: '⚡', label: 'Energéticas' },
  { emoji: '🚬', label: 'Tabaco / vape' }
] as const

export type CategoryEmojiPreset = (typeof CATEGORY_EMOJI_PRESETS)[number]
