-- Categorías dinámicas + catálogo por máquina (productos permitidos por máquina)
-- Las ranuras siguen enlazando product_id; solo se pueden asignar productos presentes en machine_products.

-- Tabla de categorías (gestión desde la app)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT categories_name_unique UNIQUE (name)
);

-- Productos: categoría opcional + precios (si aún no existen en tu proyecto)
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS purchase_price NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price NUMERIC NOT NULL DEFAULT 0;

-- Qué productos del catálogo global puede usar cada máquina en sus ranuras
CREATE TABLE IF NOT EXISTS machine_products (
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (machine_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_machine_products_product_id ON machine_products (product_id);

-- Semilla de categorías (idempotente)
INSERT INTO categories (name, sort_order)
SELECT v.name, v.sort_order
FROM (VALUES
  ('Bebidas', 10),
  ('Snacks', 20),
  ('Café e insumos', 30),
  ('Otros', 90)
) AS v(name, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.name = v.name);

-- Rellenar catálogo por máquina según ranuras ya asignadas
INSERT INTO machine_products (machine_id, product_id)
SELECT DISTINCT s.machine_id, s.product_id
FROM slots s
WHERE s.product_id IS NOT NULL
ON CONFLICT DO NOTHING;
