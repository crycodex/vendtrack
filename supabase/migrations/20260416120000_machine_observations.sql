-- Notas libres por máquina (ubicación, incidencias, contacto, etc.)
ALTER TABLE machines
  ADD COLUMN IF NOT EXISTS observations TEXT;
