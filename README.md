# VendTrack

Aplicación web para **inventario de máquinas expendedoras y de café**: catálogo global de productos, catálogo por máquina, grilla de ranuras, historial de stock y reportes exportables a PDF.

## Stack

| Tecnología | Uso |
|------------|-----|
| [Nuxt 4](https://nuxt.com/) | Framework Vue, rutas en `app/pages/` |
| [Nuxt UI v4](https://ui.nuxt.com/) | Componentes (`UButton`, `UInput`, `USelectMenu`, `UModal`, …) |
| [Supabase](https://supabase.com/) | Postgres + API (`@nuxtjs/supabase`) |
| [Tailwind CSS v4](https://tailwindcss.com/) | Estilos vía `@import "@nuxt/ui"` en `app/assets/css/main.css` |
| [jsPDF](https://github.com/parallax/jsPDF) + [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) | Reportes PDF en `app/utils/pdfReport.ts` |

## Requisitos

- Node.js 20+ (recomendado 22+)
- [pnpm](https://pnpm.io/) 10+
- Proyecto Supabase con las migraciones aplicadas (ver más abajo)

## Configuración

1. Clona el repositorio e instala dependencias:

   ```bash
   pnpm install
   ```

2. Crea un archivo `.env` en la raíz con las credenciales del proyecto Supabase (Dashboard → Settings → API):

   ```env
   SUPABASE_URL="https://<ref>.supabase.co"
   SUPABASE_KEY="<anon_public_key>"
   ```

   No subas `.env` al repositorio.

3. Aplica el esquema en la base de datos:

   - Con [Supabase CLI](https://supabase.com/docs/guides/cli): `supabase db push` o ejecuta los SQL en `supabase/migrations/` desde el SQL Editor del panel.

   El archivo `supabase/schema.sql` es **referencia idempotente** (útil en entornos vacíos); en proyectos reales la fuente de verdad son las **migraciones**.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo (http://localhost:3000) |
| `pnpm build` | Build de producción |
| `pnpm preview` | Vista previa del build |
| `pnpm typecheck` | Comprobación TypeScript (`nuxi typecheck`) |
| `pnpm lint` | ESLint |

## Modelo de datos (resumen)

- **machines**: nombre, tipo (`vending` | `coffee`), filas/columnas (vending), efectivo recaudado.
- **categories**: nombre único, orden, **emoji** opcional (icono visual y filtros).
- **products**: SKU único, precios compra/venta, `category_id`, capacidad por defecto por ranura.
- **machine_products**: qué productos del catálogo global puede usar cada máquina en sus ranuras.
- **slots**: ranura por máquina (fila/columna en vending), producto, cantidad y máximo.
- **stock_logs**: cambios de cantidad por ranura (base para ventas inferidas en el dashboard).

Las migraciones en `supabase/migrations/` crean/amplian tablas e índices; alinear cambios nuevos ahí y, si quieres, actualizar `supabase/schema.sql`.

## Funcionalidades principales

### Dashboard (`/`)

- Pestaña **Máquinas**: tarjetas con ocupación, efectivo y alertas; búsqueda por nombre.
- **Inventario general**: stock agregado por producto, KPIs, búsqueda, filtros; PDF agregado y PDF detalle por máquina.
- **Reporte de ganancias**: totales a partir de reducciones de stock, tabla con máquina y producto, búsqueda, exportación PDF.

### Catálogo global (`/catalog`)

- CRUD de productos, categorías con **emoji** elegido entre una lista predefinida (`app/utils/categoryEmojiPresets.ts`).
- Tabla con búsqueda y **filtro por icono de categoría** (los ítems del combobox no usan `value` vacío: ver `app/utils/comboSentinel.ts`).

### Máquina (`/machine/[id]`)

- Nombre editable, efectivo, dimensiones de grilla (vending).
- **Catálogo de la máquina**: añadir o quitar productos del catálogo global; “Importar todos”.
- **Grilla**: asignación de producto y cantidades; **emoji de categoría** visible en cada celda cuando existe.
- Café: lista de insumos (`CoffeeList`) con la misma lógica de catálogo por máquina.
- Acciones: rellenar ranuras con producto al máximo (solo vending), PDF de inventario de esa máquina, búsqueda en tablas locales.

### Reportes PDF

- `generateInventoryReport` / `generateMachineInventoryPdf`: detalle por ranura.
- `generateAggregatedInventoryPdf`: inventario global agregado.
- `generateProfitsReportPdf`: historial de movimientos de venta inferidos.

## Detalles de UI / convenciones

- **Tema claro forzado** para Nuxt UI (`nuxt.config.ts` → `colorMode`), alineado con el layout en `app/app.vue`.
- **Combobox (Roka / `USelectMenu`)**: no usar `value: ''` en ítems; usar centinela `COMBO_EMPTY_VALUE` en `comboSentinel.ts` y mapear a `null` al guardar.
- Tipos compartidos en `app/types/index.ts`.

## Estructura relevante

```
app/
  app.vue              # Layout + UApp
  pages/
    index.vue          # Dashboard
    catalog.vue        # Catálogo global
    machine/[id].vue   # Detalle de máquina
  components/
    SlotCell.vue       # Celda de grilla vending
    VendingGrid.vue
    CoffeeList.vue
    MachineCard.vue
  composables/
    useVendTrack.ts    # Acceso Supabase y lógica de negocio
  utils/
    pdfReport.ts
    comboSentinel.ts
    categoryEmojiPresets.ts
supabase/
  migrations/
  schema.sql           # Referencia idempotente
```

## Licencia

[MIT](LICENSE) © 2026 VendTrack contributors.
