-- Emoji opcional por categoría (filtrado y visualización en catálogo)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS emoji text;

COMMENT ON COLUMN categories.emoji IS 'Emoji visual (ej. 🥤); elegido de presets en la app';

-- Valores sugeridos para categorías semilla existentes
UPDATE categories SET emoji = '🥤' WHERE name = 'Bebidas' AND emoji IS NULL;
UPDATE categories SET emoji = '🍫' WHERE name = 'Snacks' AND emoji IS NULL;
UPDATE categories SET emoji = '☕' WHERE name = 'Café e insumos' AND emoji IS NULL;
UPDATE categories SET emoji = '📦' WHERE name = 'Otros' AND emoji IS NULL;
