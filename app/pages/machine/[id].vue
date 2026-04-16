<template>
  <div>
    <div class="mb-4">
      <NuxtLink to="/" class="text-sm font-medium text-gray-500 hover:text-gray-900 inline-flex items-center">
        <UIcon name="lucide:arrow-left" class="w-4 h-4 mr-1" />
        Volver al Dashboard
      </NuxtLink>
    </div>

    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="lucide:loader-2" class="w-8 h-8 animate-spin text-gray-400" />
    </div>

    <div v-else-if="error || !machine" class="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
      No se pudo cargar la información de la máquina.
    </div>

    <div v-else>
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            {{ machine.name }}
            <UIcon v-if="machine.type === 'vending'" name="lucide:box" class="w-6 h-6 text-blue-500" />
            <UIcon v-else name="lucide:coffee" class="w-6 h-6 text-orange-500" />
          </h1>
          <p class="text-gray-500 capitalize">{{ machine.type }}</p>
        </div>
        <div class="flex items-center gap-3">
          <UButton 
            v-if="machine.type === 'vending'"
            color="white"
            icon="lucide:package-plus"
            @click="handleRefillAll"
          >
            Rellenar Todo
          </UButton>
          <UButton 
            color="neutral"
            icon="lucide:file-text"
            @click="generateReport"
            :loading="isGeneratingReport"
          >
            Reporte PDF
          </UButton>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Main Grid / List Area -->
        <div class="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div v-if="machine.type === 'vending'">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900">Grilla de Inventario</h3>
              <p class="text-sm text-gray-500">Filas: {{ machine.rows }} × Columnas: {{ machine.columns }}</p>
            </div>
            <VendingGrid 
              :slots="slots" 
              :columns="machine.columns || 1" 
              @update:qty="handleUpdateQty" 
            />
          </div>
          <div v-else>
            <div class="mb-4">
              <h3 class="text-lg font-medium text-gray-900">Insumos</h3>
            </div>
            <CoffeeList 
              :slots="slots" 
              @update:qty="handleUpdateQty" 
            />
          </div>
        </div>

        <!-- Sidebar Actions -->
        <div class="space-y-6">
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 class="text-gray-900 font-medium mb-3">Efectivo Recaudado</h3>
            <div class="flex items-center gap-2 mb-3">
              <p class="text-3xl font-bold text-gray-900 flex-1">${{ machine.cash_collected }}</p>
            </div>
            
            <div class="space-y-3">
              <UInput
                v-model.number="tempCash"
                type="number"
                placeholder="Nuevo monto..."
                icon="lucide:dollar-sign"
              />
              <UButton 
                block 
                color="black"
                @click="updateCash"
                :loading="isUpdatingCash"
                :disabled="tempCash === null || tempCash === Number(machine.cash_collected)"
              >
                Actualizar Efectivo
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Machine, Slot } from '~/types'
import { generateInventoryReport } from '~/utils/pdfReport'

const route = useRoute()
const { fetchMachine, fetchSlotsForMachine, updateSlotQuantity, refillAllSlots, updateCashCollected } = useVendTrack()

const machineId = route.params.id as string
const pending = ref(true)
const error = ref<Error | null>(null)
const machine = ref<Machine | null>(null)
const slots = ref<Slot[]>([])

const tempCash = ref<number | null>(null)
const isUpdatingCash = ref(false)
const isGeneratingReport = ref(false)

const loadData = async () => {
  pending.value = true
  try {
    machine.value = await fetchMachine(machineId)
    slots.value = await fetchSlotsForMachine(machineId)
    tempCash.value = Number(machine.value.cash_collected) || 0
  } catch (e: any) {
    console.error(e)
    error.value = e
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  loadData()
})

const handleUpdateQty = async (id: string, newQty: number, prevQty: number) => {
  try {
    await updateSlotQuantity(id, newQty, prevQty)
    // Update local state without full reload
    const idx = slots.value.findIndex(s => s.id === id)
    if (idx > -1) {
      slots.value[idx].quantity = newQty
    }
  } catch (err) {
    console.error('Error updating quantity:', err)
    alert("Error al actualizar inventario")
  }
}

const handleRefillAll = async () => {
  if (!confirm('¿Seguro que deseas rellenar todas las ranuras al máximo?')) return
  try {
    await refillAllSlots(machineId, slots.value)
    await loadData() // Reload to get fresh states
  } catch (err) {
    console.error('Error refilling:', err)
    alert('Hubo un error al rellenar las ranuras')
  }
}

const updateCash = async () => {
  if (tempCash.value === null) return
  isUpdatingCash.value = true
  try {
    await updateCashCollected(machineId, tempCash.value)
    if (machine.value) {
      machine.value.cash_collected = tempCash.value
    }
  } catch (err) {
    console.error('Error updating cash:', err)
    alert('No se pudo actualizar el efectivo')
  } finally {
    isUpdatingCash.value = false
  }
}

const generateReport = () => {
  if (!machine.value) return
  isGeneratingReport.value = true
  try {
    generateInventoryReport([{ machine: machine.value, slots: slots.value }])
  } catch (e) {
    console.error('Error generating PDF', e)
    alert("Hubo un error al generar el PDF.")
  } finally {
    isGeneratingReport.value = false
  }
}
</script>
