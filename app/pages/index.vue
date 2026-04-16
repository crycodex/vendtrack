<template>
  <div>
    <div class="flex items-center justify-between mb-8 flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-1">
          Dashboard
        </h1>
        <p class="text-gray-500">
          Resumen y control general
        </p>
      </div>
      <div class="flex items-center space-x-4">
        <div class="bg-gray-100 rounded-lg px-4 py-2 text-right">
          <p class="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">
            Total Efectivo Máquinas
          </p>
          <p class="text-2xl font-bold text-gray-900">
            ${{ totalCash.toFixed(2) }}
          </p>
        </div>
        <UButton
          color="neutral"
          size="lg"
          icon="lucide:file-text"
          :loading="isGeneratingReport"
          @click="generateGlobalReport"
        >
          Reporte de Inventario
        </UButton>
      </div>
    </div>

    <div
      v-if="pending"
      class="flex justify-center py-12"
    >
      <UIcon
        name="lucide:loader-2"
        class="w-8 h-8 animate-spin text-gray-400"
      />
    </div>

    <div
      v-else-if="error"
      class="bg-red-50 text-red-600 p-4 rounded-xl mb-6"
    >
      No se pudo cargar la información. Revisa tu conexión a Supabase.
    </div>

    <UTabs
      v-else
      :items="tabItems"
      class="w-full"
    >
      <template #machines>
        <div class="pt-6 space-y-4">
          <UInput
            v-model="machineSearch"
            icon="lucide:search"
            placeholder="Buscar máquina por nombre…"
            size="md"
            class="w-full max-w-md"
          />
          <div
            v-if="machines.length === 0"
            class="py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100"
          >
            <UIcon
              name="lucide:cpu"
              class="w-10 h-10 text-gray-300 mx-auto mb-2"
            />
            <p class="font-medium">
              No hay máquinas registradas.
            </p>
          </div>
          <div
            v-else-if="filteredMachines.length === 0"
            class="py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100"
          >
            <UIcon
              name="lucide:search-x"
              class="w-10 h-10 text-gray-300 mx-auto mb-2"
            />
            <p class="font-medium">
              Ninguna máquina coincide con «{{ machineSearch.trim() }}».
            </p>
          </div>
          <div
            v-else
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <MachineCard
              v-for="machine in filteredMachines"
              :key="machine.id"
              :machine="machine"
              :slots="slotsMap[machine.id] || []"
            />
          </div>
        </div>
      </template>

      <template #inventory>
        <div class="mt-6 space-y-6">
          <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UIcon
                  name="lucide:boxes"
                  class="w-5 h-5 text-gray-400"
                />
                Inventario general
              </h2>
              <p class="text-sm text-gray-500 mt-1 max-w-xl">
                Stock actual en todas las máquinas, agregado por producto. Los valores de venta son potenciales (precio × unidades en máquina).
              </p>
            </div>
            <div class="flex flex-wrap gap-2 shrink-0">
              <UButton
                color="neutral"
                icon="lucide:file-stack"
                :loading="isGeneratingAggregatedPdf"
                @click="exportAggregatedInventoryPdf"
              >
                PDF agregado
              </UButton>
              <UButton
                color="primary"
                variant="soft"
                icon="lucide:layout-grid"
                :loading="isGeneratingReport"
                @click="generateGlobalReport"
              >
                PDF por máquina
              </UButton>
            </div>
          </div>

          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Unidades
              </p>
              <p class="text-xl font-bold text-gray-900 tabular-nums mt-1">
                {{ totalGlobalUnits }}
              </p>
            </div>
            <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Valor costo
              </p>
              <p class="text-xl font-bold text-gray-900 tabular-nums mt-1">
                ${{ totalGlobalCost.toFixed(2) }}
              </p>
            </div>
            <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Valor venta potencial
              </p>
              <p class="text-xl font-bold text-emerald-800 tabular-nums mt-1">
                ${{ totalGlobalRevenue.toFixed(2) }}
              </p>
            </div>
            <div class="rounded-xl border border-gray-100 bg-linear-to-br from-slate-50 to-white p-4 shadow-sm">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Margen potencial
              </p>
              <p class="text-xl font-bold text-slate-900 tabular-nums mt-1">
                ${{ inventoryMargin.toFixed(2) }}
              </p>
              <p class="text-xs text-gray-500 mt-0.5">
                {{ inventoryMarginPct }}% sobre venta potencial
              </p>
            </div>
          </div>

          <UInput
            v-model="inventorySearch"
            icon="lucide:search"
            placeholder="Filtrar por producto…"
            class="max-w-md"
            size="md"
          />

          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-100">
                    <th class="py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Producto / insumo
                    </th>
                    <th class="py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                      Unidades
                    </th>
                    <th class="py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                      Valor costo
                    </th>
                    <th class="py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                      Venta potencial
                    </th>
                    <th class="py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                      Margen
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr
                    v-for="inv in filteredGlobalInventory"
                    :key="inv.id"
                    class="hover:bg-gray-50/80 transition-colors"
                  >
                    <td class="py-3.5 px-5 font-medium text-gray-900">
                      {{ inv.name }}
                    </td>
                    <td class="py-3.5 px-5 text-right text-gray-700 tabular-nums">
                      {{ inv.qty }}
                    </td>
                    <td class="py-3.5 px-5 text-right text-gray-600 tabular-nums">
                      ${{ inv.totalCost.toFixed(2) }}
                    </td>
                    <td class="py-3.5 px-5 text-right font-medium text-gray-900 tabular-nums">
                      ${{ inv.totalRevenue.toFixed(2) }}
                    </td>
                    <td class="py-3.5 px-5 text-right text-emerald-700 tabular-nums">
                      ${{ (inv.totalRevenue - inv.totalCost).toFixed(2) }}
                    </td>
                  </tr>
                  <tr v-if="globalInventory.length === 0">
                    <td
                      colspan="5"
                      class="py-12 text-center text-gray-500"
                    >
                      <UIcon
                        name="lucide:package-open"
                        class="w-10 h-10 text-gray-300 mx-auto mb-2"
                      />
                      No hay inventario con producto asignado en las máquinas.
                    </td>
                  </tr>
                  <tr v-else-if="filteredGlobalInventory.length === 0">
                    <td
                      colspan="5"
                      class="py-10 text-center text-gray-500"
                    >
                      Ningún producto coincide con «{{ inventorySearch.trim() }}».
                    </td>
                  </tr>
                  <tr
                    v-if="globalInventory.length > 0"
                    class="bg-gray-50/90 font-semibold border-t border-gray-200"
                  >
                    <td class="py-3.5 px-5 text-gray-700">
                      Totales (filtro)
                    </td>
                    <td class="py-3.5 px-5 text-right text-gray-900 tabular-nums">
                      {{ filteredTotals.units }}
                    </td>
                    <td class="py-3.5 px-5 text-right text-gray-900 tabular-nums">
                      ${{ filteredTotals.cost.toFixed(2) }}
                    </td>
                    <td class="py-3.5 px-5 text-right text-gray-900 tabular-nums">
                      ${{ filteredTotals.revenue.toFixed(2) }}
                    </td>
                    <td class="py-3.5 px-5 text-right text-emerald-800 tabular-nums">
                      ${{ (filteredTotals.revenue - filteredTotals.cost).toFixed(2) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>

      <template #profits>
        <div class="mt-6 space-y-6">
          <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UIcon
                  name="lucide:pie-chart"
                  class="w-5 h-5 text-gray-400"
                />
                Reporte de ganancias
              </h2>
              <p class="text-sm text-gray-500 mt-1 max-w-2xl">
                Cada fila es una reducción de stock en una ranura (venta inferida). Costo e ingresos se calculan con precios de compra y venta del producto en ese momento.
              </p>
              <p class="text-xs text-gray-400 mt-2">
                {{ salesLogs.length }} movimiento(s) de venta en el historial.
              </p>
            </div>
            <UButton
              color="primary"
              variant="soft"
              icon="lucide:file-text"
              :loading="isGeneratingProfitsPdf"
              @click="exportProfitsPdf"
            >
              Exportar PDF
            </UButton>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <p class="text-sm text-gray-500 mb-1">
                Costo mercadería vendida
              </p>
              <p class="text-2xl font-bold text-gray-900 tabular-nums flex items-center gap-2">
                <UIcon
                  name="lucide:trending-down"
                  class="text-rose-500 w-5 h-5 shrink-0"
                />
                ${{ reportTotals.costs.toFixed(2) }}
              </p>
            </div>
            <div class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <p class="text-sm text-gray-500 mb-1">
                Ingresos (ventas)
              </p>
              <p class="text-2xl font-bold text-gray-900 tabular-nums flex items-center gap-2">
                <UIcon
                  name="lucide:coins"
                  class="text-emerald-600 w-5 h-5 shrink-0"
                />
                ${{ reportTotals.revenue.toFixed(2) }}
              </p>
            </div>
            <div class="rounded-xl border border-amber-100 bg-amber-50/50 p-5 shadow-sm">
              <p class="text-sm text-amber-900/80 mb-1">
                Ganancia neta
              </p>
              <p class="text-2xl font-bold text-amber-950 tabular-nums flex items-center gap-2">
                <UIcon
                  name="lucide:percent"
                  class="text-amber-600 w-5 h-5 shrink-0"
                />
                ${{ reportTotals.profit.toFixed(2) }}
              </p>
              <p class="text-xs text-amber-800/80 mt-1">
                Margen sobre ingresos: {{ profitMarginPct }}%
              </p>
            </div>
            <div class="rounded-xl border border-gray-100 bg-slate-50 p-5 shadow-sm flex flex-col justify-center">
              <p class="text-sm text-gray-600">
                Promedio por movimiento
              </p>
              <p class="text-xl font-semibold text-gray-900 tabular-nums mt-1">
                ${{ avgProfitPerSale.toFixed(2) }}
              </p>
            </div>
          </div>

          <UInput
            v-model="profitsSearch"
            icon="lucide:search"
            placeholder="Filtrar por máquina, producto o fecha…"
            class="max-w-md"
            size="md"
          />

          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-100">
                    <th class="py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th class="py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Máquina
                    </th>
                    <th class="py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th class="py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                      Uds.
                    </th>
                    <th class="py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                      Ganancia
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr
                    v-for="log in filteredSalesLogs"
                    :key="log.id"
                    class="hover:bg-gray-50/80 transition-colors"
                  >
                    <td class="py-3.5 px-5 text-sm text-gray-600 whitespace-nowrap">
                      {{ formatLogDate(log.changed_at) }}
                    </td>
                    <td class="py-3.5 px-5 text-sm font-medium text-gray-800">
                      {{ machineName(log.slot?.machine_id) }}
                    </td>
                    <td class="py-3.5 px-5 font-medium text-gray-900">
                      {{ log.slot?.product?.name || '—' }}
                    </td>
                    <td class="py-3.5 px-5 text-sm text-center text-gray-700 tabular-nums">
                      {{ log.prev_qty - log.new_qty }}
                    </td>
                    <td class="py-3.5 px-5 text-sm text-right font-medium text-emerald-700 tabular-nums">
                      ${{ lineProfit(log).toFixed(2) }}
                    </td>
                  </tr>
                  <tr v-if="salesLogs.length === 0">
                    <td
                      colspan="5"
                      class="py-12 text-center text-gray-500"
                    >
                      <UIcon
                        name="lucide:history"
                        class="w-10 h-10 text-gray-300 mx-auto mb-2"
                      />
                      Aún no hay ventas registradas (reducciones de stock).
                    </td>
                  </tr>
                  <tr v-else-if="filteredSalesLogs.length === 0">
                    <td
                      colspan="5"
                      class="py-10 text-center text-gray-500"
                    >
                      Ningún movimiento coincide con «{{ profitsSearch.trim() }}».
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>
    </UTabs>
  </div>
</template>

<script setup lang="ts">
import type { Machine, Slot, StockLog, Product } from '~/types'
import {
  generateAggregatedInventoryPdf,
  generateInventoryReport,
  generateProfitsReportPdf
} from '~/utils/pdfReport'

const { fetchMachines, fetchSlotsForMachine, fetchStockLogs } = useVendTrack()
const toast = useToast()

const pending = ref(true)
const error = ref<Error | null>(null)
const machineSearch = ref('')
const inventorySearch = ref('')
const profitsSearch = ref('')
const machines = ref<Machine[]>([])
const slotsMap = ref<Record<string, Slot[]>>({})
const logs = ref<(StockLog & { slot?: { machine_id: string, product?: Product } })[]>([])
const isGeneratingReport = ref(false)
const isGeneratingAggregatedPdf = ref(false)
const isGeneratingProfitsPdf = ref(false)

const tabItems = [
  { label: 'Máquinas', slot: 'machines', icon: 'lucide:cpu' },
  { label: 'Inventario General', slot: 'inventory', icon: 'lucide:boxes' },
  { label: 'Reporte Ganancias', slot: 'profits', icon: 'lucide:pie-chart' }
]

const totalCash = computed(() => {
  return machines.value.reduce((acc, m) => acc + (Number(m.cash_collected) || 0), 0)
})

const filteredMachines = computed(() => {
  const q = machineSearch.value.trim().toLowerCase()
  if (!q) return machines.value
  return machines.value.filter(m => m.name.toLowerCase().includes(q))
})

const globalInventory = computed(() => {
  const map: Record<string, { id: string, name: string, qty: number, totalCost: number, totalRevenue: number }> = {}
  Object.values(slotsMap.value).flat().forEach((s) => {
    if (s.product_id && s.product) {
      const entry = (map[s.product_id] ||= { id: s.product_id, name: s.product.name, qty: 0, totalCost: 0, totalRevenue: 0 })
      entry.qty += s.quantity
      entry.totalCost += s.quantity * (Number(s.product.purchase_price) || 0)
      entry.totalRevenue += s.quantity * (Number(s.product.sale_price) || 0)
    }
  })
  return Object.values(map).sort((a, b) => b.qty - a.qty)
})

const totalGlobalCost = computed(() => globalInventory.value.reduce((acc, inv) => acc + inv.totalCost, 0))
const totalGlobalRevenue = computed(() => globalInventory.value.reduce((acc, inv) => acc + inv.totalRevenue, 0))

const totalGlobalUnits = computed(() =>
  globalInventory.value.reduce((acc, inv) => acc + inv.qty, 0)
)

const inventoryMargin = computed(
  () => totalGlobalRevenue.value - totalGlobalCost.value
)

const inventoryMarginPct = computed(() => {
  const r = totalGlobalRevenue.value
  if (r <= 0) return '0.0'
  return ((inventoryMargin.value / r) * 100).toFixed(1)
})

const filteredGlobalInventory = computed(() => {
  const q = inventorySearch.value.trim().toLowerCase()
  if (!q) return globalInventory.value
  return globalInventory.value.filter(inv => inv.name.toLowerCase().includes(q))
})

const filteredTotals = computed(() => {
  const rows = filteredGlobalInventory.value
  return {
    units: rows.reduce((a, i) => a + i.qty, 0),
    cost: rows.reduce((a, i) => a + i.totalCost, 0),
    revenue: rows.reduce((a, i) => a + i.totalRevenue, 0)
  }
})

const machineById = computed(() =>
  Object.fromEntries(machines.value.map(m => [m.id, m.name]))
)

function machineName(id: string | undefined) {
  if (!id) return '—'
  return machineById.value[id] ?? '—'
}

function formatLogDate(iso: string) {
  return new Date(iso).toLocaleString('es', {
    dateStyle: 'short',
    timeStyle: 'short'
  })
}

function lineProfit(log: StockLog & { slot?: { machine_id: string, product?: Product } }) {
  const soldQty = log.prev_qty - log.new_qty
  const pur = Number(log.slot?.product?.purchase_price) || 0
  const sal = Number(log.slot?.product?.sale_price) || 0
  return soldQty * (sal - pur)
}

// A sale is registered when new_qty < prev_qty
const salesLogs = computed(() => {
  return logs.value.filter(log => log.new_qty < log.prev_qty)
})

const filteredSalesLogs = computed(() => {
  const q = profitsSearch.value.trim().toLowerCase()
  if (!q) return salesLogs.value
  return salesLogs.value.filter((log) => {
    const m = machineName(log.slot?.machine_id).toLowerCase()
    const p = (log.slot?.product?.name || '').toLowerCase()
    const d = formatLogDate(log.changed_at).toLowerCase()
    return m.includes(q) || p.includes(q) || d.includes(q)
  })
})

const reportTotals = computed(() => {
  let costs = 0
  let revenue = 0

  salesLogs.value.forEach((log) => {
    const soldQty = log.prev_qty - log.new_qty
    const purPrice = Number(log.slot?.product?.purchase_price) || 0
    const salPrice = Number(log.slot?.product?.sale_price) || 0

    costs += soldQty * purPrice
    revenue += soldQty * salPrice
  })

  return {
    costs,
    revenue,
    profit: revenue - costs
  }
})

const profitMarginPct = computed(() => {
  const r = reportTotals.value.revenue
  if (r <= 0) return '0.0'
  return ((reportTotals.value.profit / r) * 100).toFixed(1)
})

const avgProfitPerSale = computed(() => {
  const n = salesLogs.value.length
  if (n === 0) return 0
  return reportTotals.value.profit / n
})

onMounted(async () => {
  try {
    const [machinesData, logsData] = await Promise.all([
      fetchMachines(),
      fetchStockLogs()
    ])
    machines.value = machinesData
    logs.value = logsData

    for (const machine of machines.value) {
      slotsMap.value[machine.id] = await fetchSlotsForMachine(machine.id)
    }
  } catch (e: unknown) {
    console.error(e)
    error.value = e as Error
  } finally {
    pending.value = false
  }
})

const generateGlobalReport = () => {
  isGeneratingReport.value = true
  try {
    const reportData = machines.value.map(machine => ({
      machine,
      slots: slotsMap.value[machine.id] || []
    }))
    generateInventoryReport(reportData)
    toast.add({ title: 'PDF generado (detalle por máquina)', color: 'success', icon: 'lucide:check' })
  } catch (e) {
    console.error('Error generating PDF', e)
    toast.add({ title: 'Hubo un error al generar el PDF', color: 'error', icon: 'lucide:x' })
  } finally {
    isGeneratingReport.value = false
  }
}

const exportAggregatedInventoryPdf = () => {
  isGeneratingAggregatedPdf.value = true
  try {
    generateAggregatedInventoryPdf(globalInventory.value, {
      units: totalGlobalUnits.value,
      cost: totalGlobalCost.value,
      revenue: totalGlobalRevenue.value
    })
    toast.add({ title: 'PDF de inventario agregado listo', color: 'success', icon: 'lucide:check' })
  } catch (e) {
    console.error(e)
    toast.add({ title: 'Error al generar el PDF', color: 'error', icon: 'lucide:x' })
  } finally {
    isGeneratingAggregatedPdf.value = false
  }
}

const exportProfitsPdf = () => {
  isGeneratingProfitsPdf.value = true
  try {
    const rows = salesLogs.value.map(log => ({
      date: formatLogDate(log.changed_at),
      machine: machineName(log.slot?.machine_id),
      product: log.slot?.product?.name || '—',
      qty: log.prev_qty - log.new_qty,
      lineProfit: lineProfit(log)
    }))
    generateProfitsReportPdf(rows, {
      costs: reportTotals.value.costs,
      revenue: reportTotals.value.revenue,
      profit: reportTotals.value.profit
    })
    toast.add({ title: 'PDF de ganancias listo', color: 'success', icon: 'lucide:check' })
  } catch (e) {
    console.error(e)
    toast.add({ title: 'Error al generar el PDF', color: 'error', icon: 'lucide:x' })
  } finally {
    isGeneratingProfitsPdf.value = false
  }
}
</script>
