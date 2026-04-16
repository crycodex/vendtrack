<template>
  <div>
    <div class="flex items-center justify-between mb-8 flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p class="text-gray-500">Resumen y control general</p>
      </div>
      <div class="flex items-center space-x-4">
        <div class="bg-gray-100 rounded-lg px-4 py-2 text-right">
          <p class="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">Total Efectivo Máquinas</p>
          <p class="text-2xl font-bold text-gray-900">${{ totalCash.toFixed(2) }}</p>
        </div>
        <UButton 
          color="neutral"
          size="lg"
          icon="lucide:file-text"
          @click="generateGlobalReport"
          :loading="isGeneratingReport"
        >
          Reporte de Inventario
        </UButton>
      </div>
    </div>

    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="lucide:loader-2" class="w-8 h-8 animate-spin text-gray-400" />
    </div>

    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
      No se pudo cargar la información. Revisa tu conexión a Supabase.
    </div>

    <UTabs v-else :items="tabItems" class="w-full">
      <template #machines>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          <MachineCard 
            v-for="machine in machines" 
            :key="machine.id"
            :machine="machine"
            :slots="slotsMap[machine.id] || []"
          />
        </div>
      </template>

      <template #inventory>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="py-3 px-4 text-sm font-medium text-gray-500">Producto / Insumo</th>
                <th class="py-3 px-4 text-sm font-medium text-gray-500">Total Unidades</th>
                <th class="py-3 px-4 text-sm font-medium text-gray-500">Valor de Costo</th>
                <th class="py-3 px-4 text-sm font-medium text-gray-500">Valor Potencial Venta</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in globalInventory" :key="inv.id" class="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td class="py-3 px-4 font-medium text-gray-900">{{ inv.name }}</td>
                <td class="py-3 px-4 text-gray-700">{{ inv.qty }}</td>
                <td class="py-3 px-4 text-gray-500">${{ inv.totalCost.toFixed(2) }}</td>
                <td class="py-3 px-4 text-gray-900">${{ inv.totalRevenue.toFixed(2) }}</td>
              </tr>
              <tr v-if="globalInventory.length === 0">
                <td colspan="4" class="py-8 text-center text-gray-500">No hay inventario registrado</td>
              </tr>
              <tr v-if="globalInventory.length > 0" class="bg-gray-50 font-bold border-t-2 border-gray-200">
                <td class="py-3 px-4 text-right" colspan="2">Totales Generales:</td>
                <td class="py-3 px-4 text-gray-900">${{ totalGlobalCost.toFixed(2) }}</td>
                <td class="py-3 px-4 text-green-700">${{ totalGlobalRevenue.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <template #profits>
        <div class="mt-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
             <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <p class="text-sm text-gray-500 mb-1">Costo de la Mercadería Vendida</p>
                <p class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <UIcon name="lucide:trending-down" class="text-red-500 w-5 h-5"/>
                  ${{ reportTotals.costs.toFixed(2) }}
                </p>
             </div>
             <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <p class="text-sm text-gray-500 mb-1">Ingresos (Ventas Calculadas)</p>
                <p class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <UIcon name="lucide:dollar-sign" class="text-green-500 w-5 h-5"/>
                  ${{ reportTotals.revenue.toFixed(2) }}
                </p>
             </div>
             <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm lg:scale-105 transition-transform ring-1 ring-black">
                <p class="text-sm text-gray-500 mb-1">Ganancia Neta Calculada</p>
                <p class="text-3xl font-black text-gray-900 flex items-center gap-2">
                  <UIcon name="lucide:trending-up" class="text-blue-500 w-6 h-6"/>
                  ${{ reportTotals.profit.toFixed(2) }}
                </p>
             </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 class="font-semibold text-gray-900">Historial de Reducciones (Ventas)</h3>
              <span class="text-xs text-gray-500">Calculado a partir de reducción de stock</span>
            </div>
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-white border-b border-gray-200">
                  <th class="py-3 px-4 text-sm font-medium text-gray-500">Fecha</th>
                  <th class="py-3 px-4 text-sm font-medium text-gray-500">Producto</th>
                  <th class="py-3 px-4 text-sm font-medium text-gray-500 text-center">Unidades</th>
                  <th class="py-3 px-4 text-sm font-medium text-gray-500 text-right">Ganancia</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in salesLogs" :key="log.id" class="border-b border-gray-50 hover:bg-gray-50">
                  <td class="py-3 px-4 text-sm text-gray-500">{{ new Date(log.changed_at).toLocaleString() }}</td>
                  <td class="py-3 px-4 font-medium text-gray-900">{{ log.slot?.product?.name || 'Producto Desconocido' }}</td>
                  <td class="py-3 px-4 text-sm text-center text-gray-700">{{ log.prev_qty - log.new_qty }}</td>
                  <td class="py-3 px-4 text-sm text-right font-medium text-blue-600">
                    ${{ ((log.prev_qty - log.new_qty) * ((log.slot?.product?.sale_price || 0) - (log.slot?.product?.purchase_price || 0))).toFixed(2) }}
                  </td>
                </tr>
                <tr v-if="salesLogs.length === 0">
                  <td colspan="4" class="py-8 text-center text-gray-500">Aún no hay historial de ventas</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </UTabs>
  </div>
</template>

<script setup lang="ts">
import type { Machine, Slot, StockLog, Product } from '~/types'
import { generateInventoryReport } from '~/utils/pdfReport'

const { fetchMachines, fetchSlotsForMachine, fetchStockLogs } = useVendTrack()

const pending = ref(true)
const error = ref<Error | null>(null)
const machines = ref<Machine[]>([])
const slotsMap = ref<Record<string, Slot[]>>({})
const logs = ref<(StockLog & { slot?: { machine_id: string, product?: Product } })[]>([])
const isGeneratingReport = ref(false)

const tabItems = [
  { label: 'Máquinas', slot: 'machines', icon: 'lucide:cpu' },
  { label: 'Inventario General', slot: 'inventory', icon: 'lucide:boxes' },
  { label: 'Reporte Ganancias', slot: 'profits', icon: 'lucide:pie-chart' }
]

const totalCash = computed(() => {
  return machines.value.reduce((acc, m) => acc + (Number(m.cash_collected) || 0), 0)
})

const globalInventory = computed(() => {
  const map: Record<string, { id: string, name: string, qty: number, totalCost: number, totalRevenue: number }> = {}
  Object.values(slotsMap.value).flat().forEach(s => {
    if (s.product_id && s.product) {
      if (!map[s.product_id]) {
        map[s.product_id] = { id: s.product_id, name: s.product.name, qty: 0, totalCost: 0, totalRevenue: 0 }
      }
      map[s.product_id].qty += s.quantity
      map[s.product_id].totalCost += s.quantity * (Number(s.product.purchase_price) || 0)
      map[s.product_id].totalRevenue += s.quantity * (Number(s.product.sale_price) || 0)
    }
  })
  return Object.values(map).sort((a,b) => b.qty - a.qty)
})

const totalGlobalCost = computed(() => globalInventory.value.reduce((acc, inv) => acc + inv.totalCost, 0))
const totalGlobalRevenue = computed(() => globalInventory.value.reduce((acc, inv) => acc + inv.totalRevenue, 0))

// A sale is registered when new_qty < prev_qty
const salesLogs = computed(() => {
  return logs.value.filter(log => log.new_qty < log.prev_qty)
})

const reportTotals = computed(() => {
  let costs = 0
  let revenue = 0
  
  salesLogs.value.forEach(log => {
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
  } catch (e: any) {
    console.error(e)
    error.value = e
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
  } catch (e) {
    console.error('Error generating PDF', e)
    alert("Hubo un error al generar el PDF.")
  } finally {
    isGeneratingReport.value = false
  }
}
</script>
