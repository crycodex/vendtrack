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
      <div class="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-1">
            <h1 v-if="!isEditingName" class="text-3xl font-bold text-gray-900 flex items-center gap-2">
              {{ machine.name }}
              <UButton icon="lucide:edit-2" variant="ghost" color="gray" size="sm" @click="startEditingName" />
            </h1>
            <div v-else class="flex items-center gap-2">
              <UInput v-model="tempName" class="font-bold text-xl" size="lg" @keydown.enter="saveName" />
              <UButton icon="lucide:check" color="black" @click="saveName" />
              <UButton icon="lucide:x" color="gray" variant="soft" @click="isEditingName = false" />
            </div>
            <UIcon v-if="machine.type === 'vending'" name="lucide:box" class="w-6 h-6 text-blue-500" />
            <UIcon v-else name="lucide:coffee" class="w-6 h-6 text-orange-500" />
          </div>
          <p class="text-gray-500 capitalize">{{ machine.type }}</p>
        </div>
        <div class="flex items-center gap-3 mt-2 md:mt-0">
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
        <!-- Main Area: Grid & Local Inventory -->
        <div class="lg:col-span-3 space-y-6">
          
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div v-if="machine.type === 'vending'">
              <div class="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <h3 class="text-lg font-medium text-gray-900">Grilla de Inventario</h3>
                <div class="flex items-center gap-2 md:gap-4 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                   <div class="flex items-center gap-1.5">
                     <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">F</span>
                     <UInput v-model.number="tempRows" type="number" min="1" size="2xs" class="w-14" :padded="false" input-class="text-center font-medium"/>
                   </div>
                   <UIcon name="lucide:x" class="w-3 h-3 text-gray-400" />
                   <div class="flex items-center gap-1.5">
                     <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">C</span>
                     <UInput v-model.number="tempCols" type="number" min="1" size="2xs" class="w-14" :padded="false" input-class="text-center font-medium"/>
                   </div>
                   <div class="pl-2 border-l border-gray-200" v-if="hasDimensionChanges">
                     <UButton icon="lucide:save" size="2xs" color="black" @click="saveDimensions" :loading="isSavingDimensions">Guardar</UButton>
                   </div>
                </div>
              </div>
              <VendingGrid 
                :slots="slots" 
                :columns="machine.columns || 1" 
                :products="products"
                @update:qty="handleUpdateQty" 
                @update:product="handleUpdateProduct"
              />
            </div>
            <div v-else>
              <div class="mb-4">
                <h3 class="text-lg font-medium text-gray-900">Insumos</h3>
              </div>
              <CoffeeList 
                :slots="slots" 
                :products="products"
                @update:qty="handleUpdateQty" 
                @update:product="handleUpdateProduct"
              />
            </div>
          </div>

          <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Catálogo de Máquina</h3>
            <table class="w-full text-left border-collapse mt-2">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                  <th class="py-2 px-4 text-sm font-medium text-gray-500">Producto</th>
                  <th class="py-2 px-4 text-sm font-medium text-gray-500">Total en Máquina</th>
                  <th class="py-2 px-4 text-sm font-medium text-gray-500">Valor (Costo Compra)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="inv in localInventory" :key="inv.id" class="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td class="py-3 px-4 font-medium text-gray-900">{{ inv.name }}</td>
                  <td class="py-3 px-4 text-gray-700">{{ inv.qty }} unidades</td>
                  <td class="py-3 px-4 text-gray-500">${{ (inv.qty * inv.purchase).toFixed(2) }}</td>
                </tr>
                <tr v-if="localInventory.length === 0">
                  <td colspan="3" class="py-6 text-center text-gray-500">No hay productos en esta máquina</td>
                </tr>
              </tbody>
            </table>
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
import type { Machine, Slot, Product } from '~/types'
import { generateInventoryReport } from '~/utils/pdfReport'

const route = useRoute()
const { fetchMachine, fetchSlotsForMachine, updateSlotQuantity, refillAllSlots, updateCashCollected, fetchProducts, updateMachineName, updateSlotProduct, updateMachineDimensions } = useVendTrack()

const machineId = route.params.id as string
const pending = ref(true)
const error = ref<Error | null>(null)
const machine = ref<Machine | null>(null)
const slots = ref<Slot[]>([])
const products = ref<Product[]>([])

const tempCash = ref<number | null>(null)
const isUpdatingCash = ref(false)
const isGeneratingReport = ref(false)

const isEditingName = ref(false)
const tempName = ref('')

const tempRows = ref(1)
const tempCols = ref(1)
const isSavingDimensions = ref(false)

const loadData = async () => {
  pending.value = true
  try {
    const [m_data, s_data, p_data] = await Promise.all([
      fetchMachine(machineId),
      fetchSlotsForMachine(machineId),
      fetchProducts()
    ])
    machine.value = m_data
    slots.value = s_data
    products.value = p_data
    tempCash.value = Number(m_data.cash_collected) || 0
    tempRows.value = m_data.rows || 1
    tempCols.value = m_data.columns || 1
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

const localInventory = computed(() => {
  const map: Record<string, { id: string, name: string, qty: number, purchase: number }> = {}
  slots.value.forEach(s => {
    if (s.product_id && s.product) {
      if (!map[s.product_id]) {
        map[s.product_id] = { id: s.product_id, name: s.product.name, qty: 0, purchase: s.product.purchase_price || 0 }
      }
      map[s.product_id].qty += s.quantity
    }
  })
  return Object.values(map).sort((a,b) => b.qty - a.qty)
})

const startEditingName = () => {
  if (machine.value) {
    tempName.value = machine.value.name
    isEditingName.value = true
  }
}

const saveName = async () => {
  if (!machine.value || !tempName.value.trim()) return
  try {
    await updateMachineName(machineId, tempName.value)
    machine.value.name = tempName.value
    isEditingName.value = false
  } catch(err) {
    alert("Error al actualizar nombre")
  }
}

const hasDimensionChanges = computed(() => {
  if (!machine.value) return false
  return tempRows.value !== machine.value.rows || tempCols.value !== machine.value.columns
})

const saveDimensions = async () => {
  if (!machine.value) return
  if (tempRows.value < machine.value.rows! || tempCols.value < machine.value.columns!) {
    if (!confirm('¿Estás seguro de reducir la cuadrícula? Los productos en casillas que desaparezcan serán borrados de forma permanente.')) return
  }
  isSavingDimensions.value = true
  try {
    await updateMachineDimensions(machineId, tempRows.value, tempCols.value, slots.value)
    machine.value.rows = tempRows.value
    machine.value.columns = tempCols.value
    slots.value = await fetchSlotsForMachine(machineId)
  } catch(err) {
    console.error(err)
    alert("Error al actualizar dimensiones de la máquina.")
  } finally {
    isSavingDimensions.value = false
  }
}

const handleUpdateQty = async (id: string, newQty: number, prevQty: number) => {
  try {
    await updateSlotQuantity(id, newQty, prevQty)
    const idx = slots.value.findIndex(s => s.id === id)
    if (idx > -1) {
      slots.value[idx].quantity = newQty
    }
  } catch (err) {
    console.error('Error updating quantity:', err)
    alert("Error al actualizar inventario")
  }
}

const handleUpdateProduct = async (id: string, productId: string | null) => {
  try {
    await updateSlotProduct(id, productId)
    const idx = slots.value.findIndex(s => s.id === id)
    if (idx > -1) {
      slots.value[idx].product_id = productId
      slots.value[idx].product = products.value.find(p => p.id === productId) || null
    }
  } catch (err) {
    console.error('Error updating product:', err)
    alert("Error al cambiar producto")
  }
}

const handleRefillAll = async () => {
  if (!confirm('¿Seguro que deseas rellenar todas las ranuras al máximo?')) return
  try {
    await refillAllSlots(machineId, slots.value)
    slots.value = await fetchSlotsForMachine(machineId)
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
