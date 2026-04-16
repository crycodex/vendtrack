-- Supabase Schema for VendTrack

-- Enums
CREATE TYPE machine_type AS ENUM ('vending', 'coffee');

-- Tables
CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type machine_type NOT NULL,
    rows INT,
    columns INT,
    cash_collected NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    default_max INT DEFAULT 10
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

-- Initial Data Seeding
INSERT INTO machines (id, name, type, rows, columns, cash_collected) VALUES
('11111111-1111-1111-1111-111111111111', 'Vending 1', 'vending', 6, 5, 0),
('22222222-2222-2222-2222-222222222222', 'Vending 2', 'vending', 6, 5, 0),
('33333333-3333-3333-3333-333333333333', 'Vending 3', 'vending', 5, 4, 0),
('44444444-4444-4444-4444-444444444444', 'Vending 4', 'vending', 5, 4, 0),
('55555555-5555-5555-5555-555555555555', 'Cafetera', 'coffee', NULL, NULL, 0);

-- Generate initial empty slots for Vending 1 (6x5)
DO $$
DECLARE
    r INT;
    c INT;
BEGIN
    FOR r IN 1..6 LOOP
        FOR c IN 1..5 LOOP
            INSERT INTO slots (machine_id, row, col, quantity, max_quantity) 
            VALUES ('11111111-1111-1111-1111-111111111111', r, c, 10, 10);
            
            INSERT INTO slots (machine_id, row, col, quantity, max_quantity) 
            VALUES ('22222222-2222-2222-2222-222222222222', r, c, 10, 10);
        END LOOP;
    END LOOP;
    
    FOR r IN 1..5 LOOP
        FOR c IN 1..4 LOOP
            INSERT INTO slots (machine_id, row, col, quantity, max_quantity) 
            VALUES ('33333333-3333-3333-3333-333333333333', r, c, 10, 10);
            
            INSERT INTO slots (machine_id, row, col, quantity, max_quantity) 
            VALUES ('44444444-4444-4444-4444-444444444444', r, c, 10, 10);
        END LOOP;
    END LOOP;
END $$;

-- Generate initial coffee supplies
INSERT INTO products (id, name, sku, default_max) VALUES
('aaaa1111-1111-1111-1111-111111111111', 'Café en grano (g)', 'COF-1', 1000),
('bbbb2222-2222-2222-2222-222222222222', 'Azúcar (g)', 'SUG-1', 1000),
('cccc3333-3333-3333-3333-333333333333', 'Leche en polvo (g)', 'MIL-1', 1000),
('dddd4444-4444-4444-4444-444444444444', 'Vasos', 'CUP-1', 150),
('eeee5555-5555-5555-5555-555555555555', 'Removedores', 'STIR-1', 200);

-- Assign to coffee machine slots
INSERT INTO slots (machine_id, product_id, quantity, max_quantity) VALUES
('55555555-5555-5555-5555-555555555555', 'aaaa1111-1111-1111-1111-111111111111', 1000, 1000),
('55555555-5555-5555-5555-555555555555', 'bbbb2222-2222-2222-2222-222222222222', 1000, 1000),
('55555555-5555-5555-5555-555555555555', 'cccc3333-3333-3333-3333-333333333333', 1000, 1000),
('55555555-5555-5555-5555-555555555555', 'dddd4444-4444-4444-4444-444444444444', 150, 150),
('55555555-5555-5555-5555-555555555555', 'eeee5555-5555-5555-5555-555555555555', 200, 200);
