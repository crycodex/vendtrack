-- Esquema de referencia VendTrack (alinear con migraciones en supabase/migrations/)

CREATE TYPE machine_type AS ENUM ('vending', 'coffee');

CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type machine_type NOT NULL,
    rows INT,
    columns INT,
    cash_collected NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    default_max INT DEFAULT 10,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    purchase_price NUMERIC NOT NULL DEFAULT 0,
    sale_price NUMERIC NOT NULL DEFAULT 0
);

-- Qué productos puede usar cada máquina en sus ranuras (subset del catálogo global)
CREATE TABLE machine_products (
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (machine_id, product_id)
);

CREATE TABLE slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
    row INT,
    col INT,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INT DEFAULT 0,
    max_quantity INT DEFAULT 10
);

CREATE TABLE stock_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID REFERENCES slots(id) ON DELETE CASCADE,
    prev_qty INT NOT NULL,
    new_qty INT NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_machine_products_product_id ON machine_products (product_id);
