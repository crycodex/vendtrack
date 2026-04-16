<template>
  <div>
    <div class="mb-10">
      <h1 class="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
        <span
          class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700"
        >
          <UIcon
            name="lucide:graduation-cap"
            class="w-6 h-6"
          />
        </span>
        Cómo funciona VendTrack
      </h1>
      <p class="text-gray-500 max-w-2xl leading-relaxed">
        Guía rápida para usar el inventario de máquinas expendedoras y de café:
        qué hace cada pantalla y en qué orden conviene trabajar.
      </p>
    </div>

    <div class="space-y-6">
      <UCard class="border border-gray-100 shadow-sm">
        <div class="flex gap-4">
          <UIcon
            name="lucide:lightbulb"
            class="w-6 h-6 text-amber-600 shrink-0 mt-0.5"
          />
          <div>
            <h2 class="text-lg font-semibold text-gray-900 mb-2">
              Idea general
            </h2>
            <p class="text-gray-600 text-sm leading-relaxed">
              <strong>VendTrack</strong> concentra tus <strong>máquinas</strong>, el <strong>catálogo de productos</strong>
              y el <strong>stock por ranura</strong>. Primero defines productos y precios en el catálogo global;
              luego asignas qué productos puede vender cada máquina y cuántas unidades hay en cada posición.
              Los movimientos de stock quedan registrados para ver inventario agregado y un reporte de ganancias.
            </p>
          </div>
        </div>
      </UCard>

      <UCard class="border border-gray-100 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UIcon
            name="lucide:layout-dashboard"
            class="w-5 h-5 text-gray-400"
          />
          Dashboard (inicio)
        </h2>
        <ul class="space-y-3 text-sm text-gray-600 leading-relaxed list-disc pl-5">
          <li>
            <strong>Máquinas:</strong> tarjetas con ocupación, efectivo acumulado y alertas (ranuras vacías o con poco stock).
            Puedes buscar por nombre o por <strong>observaciones</strong>. Entra en <em>Ver detalles</em> para gestionar una máquina.
          </li>
          <li>
            <strong>Inventario general:</strong> suma el stock de todas las máquinas por producto y estima coste y venta potencial.
          </li>
          <li>
            <strong>Reporte de ganancias:</strong> lista ventas inferidas cuando el stock <em>baja</em> (salida de producto) y calcula margen.
          </li>
          <li>
            Los botones de <strong>PDF</strong> generan informes descargables (inventario global, agregado o ganancias).
          </li>
        </ul>
      </UCard>

      <UCard class="border border-gray-100 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UIcon
            name="lucide:package"
            class="w-5 h-5 text-gray-400"
          />
          Catálogo global
        </h2>
        <ul class="space-y-3 text-sm text-gray-600 leading-relaxed list-disc pl-5">
          <li>
            Aquí viven los <strong>productos</strong> (nombre, SKU, precios de compra y venta) y las <strong>categorías</strong>
            (con icono opcional para filtrar).
          </li>
          <li>
            Un producto del catálogo <strong>no está automáticamente</strong> en una máquina: hay que añadirlo al
            <strong>catálogo de esa máquina</strong> desde la ficha de la máquina.
          </li>
          <li>
            Edita o crea productos antes de asignarlos a ranuras; los cambios de precio afectan a los cálculos de informes.
          </li>
        </ul>
      </UCard>

      <UCard class="border border-gray-100 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UIcon
            name="lucide:cpu"
            class="w-5 h-5 text-gray-400"
          />
          Ficha de una máquina
        </h2>
        <ul class="space-y-3 text-sm text-gray-600 leading-relaxed list-disc pl-5">
          <li>
            <strong>Nombre y tipo</strong> (vending con rejilla o café con lista de insumos). Puedes editar el nombre desde el lápiz.
          </li>
          <li>
            <strong>Observaciones:</strong> notas libres (ubicación, contacto, incidencias). Guárdalas con el botón cuando cambien.
          </li>
          <li>
            <strong>Catálogo de esta máquina:</strong> elige qué productos del catálogo global pueden usarse en las ranuras.
            Puedes añadir uno a uno o importar todo el catálogo global.
          </li>
          <li>
            <strong>Ranuras:</strong> asigna producto y cantidad; ajusta el máximo por ranura si hace falta.
            En vending, la rejilla tiene filas y columnas configurables; en café, añades insumos como filas sueltas.
          </li>
          <li>
            <strong>Efectivo registrado</strong> es un campo manual para llevar el dinero recaudado de esa máquina.
          </li>
          <li>
            <strong>Rellenar todo</strong> (solo vending) lleva al máximo de capacidad todas las ranuras que ya tienen producto asignado.
          </li>
          <li>
            <strong>PDF de inventario</strong> de esa máquina descarga el detalle por posición y alertas.
          </li>
        </ul>
      </UCard>

      <UCard class="border border-gray-100 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UIcon
            name="lucide:git-branch"
            class="w-5 h-5 text-gray-400"
          />
          Flujo recomendado
        </h2>
        <ol class="space-y-2 text-sm text-gray-600 leading-relaxed list-decimal pl-5">
          <li>Crear categorías y productos en <NuxtLink
            to="/catalog"
            class="text-gray-900 font-medium underline decoration-gray-300 hover:decoration-gray-600"
          >Catálogo</NuxtLink>.</li>
          <li>Abrir cada máquina y definir su catálogo permitido.</li>
          <li>Asignar productos y cantidades en las ranuras.</li>
          <li>Actualizar stock cuando repongas o cuando vendas (bajando cantidades en la ranura).</li>
          <li>Registrar efectivo y usar los reportes cuando necesites auditoría o margen.</li>
        </ol>
      </UCard>

      <div class="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-5 py-4 text-sm text-gray-600">
        <p class="flex items-start gap-2">
          <UIcon
            name="lucide:info"
            class="w-5 h-5 text-gray-400 shrink-0 mt-0.5"
          />
          <span>
            Las <strong>ventas</strong> en el reporte de ganancias se estiman cuando una ranura pasa a menos unidades
            (salida de stock). Si ajustas por error, el histórico reflejará ese movimiento.
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Tutorial — VendTrack',
  meta: [
    {
      name: 'description',
      content: 'Guía de uso de VendTrack: dashboard, catálogo, máquinas e inventario.'
    }
  ]
})
</script>
