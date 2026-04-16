<template>
  <div>
    <div class="flex items-center justify-between mb-8 flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p class="text-gray-500">Resumen de inventario y recaudación</p>
      </div>
      <div class="flex items-center space-x-4">
        <div class="bg-gray-100 rounded-lg px-4 py-2 text-right">
          <p class="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">Total Efectivo</p>
          <p class="text-2xl font-bold text-gray-900">${{ totalCash.toFixed(2) }}</p>
        </div>
        <UButton 
          color="neutral"
          size="lg"
          icon="lucide:file-text"
          @click="generateGlobalReport"
          :loading="isGeneratingReport"
        >
          Generar Reporte
        </UButton>
      </div>
    </div>

    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="lucide:loader-2" class="w-8 h-8 animate-spin text-gray-400" />
    </div>

    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
      No se pudo cargar la información. Revisa tu conexión a Supabase.
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <MachineCard 
        v-for="machine in machines" 
        :key="machine.id"
        :machine="machine"
        :slots="slotsMap[machine.id] || []"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Machine, Slot } from '~/types'
import { generateInventoryReport } from '~/utils/pdfReport'

const { fetchMachines, fetchSlotsForMachine } = useVendTrack()

const pending = ref(true)
const error = ref<Error | null>(null)
const machines = ref<Machine[]>([])
const slotsMap = ref<Record<string, Slot[]>>({})
const isGeneratingReport = ref(false)

const totalCash = computed(() => {
  return machines.value.reduce((acc, m) => acc + (Number(m.cash_collected) || 0), 0)
})

onMounted(async () => {
  try {
    machines.value = await fetchMachines()
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
