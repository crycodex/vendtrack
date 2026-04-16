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
              <UButton icon="lucide:edit-2" variant="ghost" color="neutral" size="sm" @click="startEditingName" />
            </h1>
            <div v-else class="flex items-center gap-2">
              <UInput v-model="tempName" class="font-bold text-xl" size="lg" @keydown.enter="saveName" />
              <UButton icon="lucide:check" color="primary" @click="saveName" />
              <UButton icon="lucide:x" color="neutral" variant="soft" @click="isEditingName = false" />
            </div>
            <UIcon v-if="machine.type === 'vending'" name="lucide:box" class="w-6 h-6 text-blue-500" />
            <UIcon v-else name="lucide:coffee" class="w-6 h-6 text-orange-500" />
          </div>
          <p class="text-gray-500 capitalize">{{ machine.type }}</p>
        </div>
        <div class="flex items-center gap-3 mt-2 md:mt-0">
          <UButton 
            v-if="machine.type === 'vending'"
            color="secondary"
            icon="lucide:package-plus"
            @click="isRefillModalOpen = true"
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
                     <UInput v-model.number="tempRows" type="number" min="1" size="xs" class="w-14" :padded="false" input-class="text-center font-medium"/>
                   </div>
                   <UIcon name="lucide:x" class="w-3 h-3 text-gray-400" />
                   <div class="flex items-center gap-1.5">
                     <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">C</span>
                     <UInput v-model.number="tempCols" type="number" min="1" size="xs" class="w-14" :padded="false" input-class="text-center font-medium"/>
                   </div>
                   <div class="pl-2 border-l border-gray-200" v-if="hasDimensionChanges">
                     <UButton icon="lucide:save" size="xs" color="primary" @click="saveDimensions" :loading="isSavingDimensions">Guardar</UButton>
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
              <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900">Insumos</h3>
                <UButton icon="lucide:plus" color="primary" size="xs" :loading="isAddingSlot" @click="handleAddCoffeeSlot">Nuevo Módulo</UButton>
              </div>
              <CoffeeList 
                :slots="slots" 
                :products="products"
                @update:qty="handleUpdateQty" 
                @update:product="handleUpdateProduct"
                @delete:slot="handleDeleteSlot"
              />
              <div v-if="slots.length === 0" class="text-center py-6 text-gray-500 bg-gray-50 border border-dashed rounded-lg">
                No hay contenedores de insumos. Agrega uno nuevo.
              </div>
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
                color="primary"
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

    <UModal v-model:open="isRefillModalOpen">
      <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">¿Rellenar Todo?</h3>
            <UButton color="neutral" variant="ghost" icon="lucide:x" class="-my-1" @click="isRefillModalOpen = false" />
          </div>
        </template>
        
        <div class="p-4 text-center">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UIcon name="lucide:package-plus" class="w-8 h-8 text-blue-600" />
          </div>
          <p class="text-gray-500 mb-6 text-sm">Esta acción rellenará todas las ranuras al límite de su capacidad configurada. Esto genera un registro masivo en el historial.</p>
          <div class="flex gap-3 justify-center">
            <UButton color="neutral" variant="soft" @click="isRefillModalOpen = false">Cancelar</UButton>
            <UButton color="info" :loading="isRefilling" @click="executeRefill">Sí, Rellenar Todo</UButton>
          </div>
        </div>
      </UCard>
      </template>
    </UModal>

    <!-- Confirm reduce dimensions -->
    <UModal v-model:open="isReduceDimsModalOpen">
      <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Confirmar reducción</h3>
            <UButton color="neutral" variant="ghost" icon="lucide:x" class="-my-1" @click="isReduceDimsModalOpen = false" />
          </div>
        </template>

        <div class="p-4">
          <div class="flex gap-4">
            <div class="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
              <UIcon name="lucide:alert-triangle" class="w-6 h-6 text-red-600" />
            </div>
            <div class="min-w-0">
              <p class="font-semibold text-gray-900">Vas a reducir la cuadrícula.</p>
              <p class="text-sm text-gray-500 mt-1">
                Los productos en casillas que desaparezcan serán borrados de forma permanente.
              </p>
            </div>
          </div>

          <div class="pt-5 mt-6 border-t border-gray-100 flex justify-end gap-3">
            <UButton color="neutral" variant="soft" @click="isReduceDimsModalOpen = false" :disabled="isSavingDimensions" size="lg" class="px-6">
              Cancelar
            </UButton>
            <UButton color="error" @click="confirmReduceDims" :loading="isSavingDimensions" size="lg" class="px-8">
              Sí, reducir
            </UButton>
          </div>
        </div>
      </UCard>
      </template>
    </UModal>

    <!-- Confirm delete coffee slot -->
    <UModal v-model:open="isDeleteSlotModalOpen">
      <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Quitar insumo</h3>
            <UButton color="neutral" variant="ghost" icon="lucide:x" class="-my-1" @click="isDeleteSlotModalOpen = false" />
          </div>
        </template>

        <div class="p-4">
          <div class="flex gap-4">
            <div class="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
              <UIcon name="lucide:trash-2" class="w-6 h-6 text-red-600" />
            </div>
            <div class="min-w-0">
              <p class="font-semibold text-gray-900">¿Quitar este conteo de insumo?</p>
              <p class="text-sm text-gray-500 mt-1">
                Se eliminará el módulo de la máquina. Esta acción no se puede deshacer.
              </p>
            </div>
          </div>

          <div class="pt-5 mt-6 border-t border-gray-100 flex justify-end gap-3">
            <UButton color="neutral" variant="soft" @click="isDeleteSlotModalOpen = false" :disabled="isDeletingSlot" size="lg" class="px-6">
              Cancelar
            </UButton>
            <UButton color="error" @click="performDeleteSlot" :loading="isDeletingSlot" size="lg" class="px-8">
              Quitar
            </UButton>
          </div>
        </div>
      </UCard>
      </template>
    </UModal>

  </div>
</template>

<script setup lang="ts">
import type { Machine, Slot, Product } from '~/types'
import { generateInventoryReport } from '~/utils/pdfReport'

const route = useRoute()
const { fetchMachine, fetchSlotsForMachine, updateSlotQuantity, refillAllSlots, updateCashCollected, fetchProducts, updateMachineName, updateSlotProduct, updateMachineDimensions, addCoffeeSlot, deleteSlot } = useVendTrack()
const toast = useToast()

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
const isReduceDimsModalOpen = ref(false)
const pendingDims = ref<{ rows: number, cols: number } | null>(null)

const isAddingSlot = ref(false)
const isRefillModalOpen = ref(false)
const isRefilling = ref(false)

const isDeleteSlotModalOpen = ref(false)
const slotToDeleteId = ref<string | null>(null)
const isDeletingSlot = ref(false)

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
      const entry = (map[s.product_id] ||= { id: s.product_id, name: s.product.name, qty: 0, purchase: s.product.purchase_price || 0 })
      entry.qty += s.quantity
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
    toast.add({ title: 'No se pudo actualizar el nombre', color: 'error', icon: 'lucide:x' })
  }
}

const hasDimensionChanges = computed(() => {
  if (!machine.value) return false
  return tempRows.value !== machine.value.rows || tempCols.value !== machine.value.columns
})

const saveDimensions = async () => {
  if (!machine.value) return
  if (tempRows.value < machine.value.rows! || tempCols.value < machine.value.columns!) {
    pendingDims.value = { rows: tempRows.value, cols: tempCols.value }
    isReduceDimsModalOpen.value = true
    return
  }
  await doSaveDimensions(tempRows.value, tempCols.value)
}

const confirmReduceDims = async () => {
  if (!pendingDims.value) return
  const { rows, cols } = pendingDims.value
  pendingDims.value = null
  isReduceDimsModalOpen.value = false
  await doSaveDimensions(rows, cols)
}

const doSaveDimensions = async (rows: number, cols: number) => {
  if (!machine.value) return
  isSavingDimensions.value = true
  try {
    await updateMachineDimensions(machineId, rows, cols, slots.value)
    machine.value.rows = rows
    machine.value.columns = cols
    slots.value = await fetchSlotsForMachine(machineId)
    toast.add({ title: 'Dimensiones actualizadas', color: 'success', icon: 'lucide:check' })
  } catch (err) {
    console.error(err)
    toast.add({ title: 'Error al actualizar dimensiones', color: 'error', icon: 'lucide:x' })
  } finally {
    isSavingDimensions.value = false
  }
}

const handleUpdateQty = async (id: string, newQty: number, prevQty: number) => {
  const idx = slots.value.findIndex(s => s.id === id)
  const slot = idx > -1 ? slots.value[idx] : undefined
  if (slot) {
    slot.quantity = newQty
  }

  try {
    await updateSlotQuantity(id, newQty, prevQty)
  } catch (err) {
    if (slot) slot.quantity = prevQty // revert
    console.error('Error updating quantity:', err)
    toast.add({ title: 'Error al actualizar inventario', color: 'error', icon: 'lucide:x' })
  }
}

const handleUpdateProduct = async (id: string, productId: string | null) => {
  try {
    await updateSlotProduct(id, productId)
    const idx = slots.value.findIndex(s => s.id === id)
    const slot = idx > -1 ? slots.value[idx] : undefined
    if (slot) {
      slot.product_id = productId
      slot.product = products.value.find(p => p.id === productId) || null
    }
  } catch (err) {
    console.error('Error updating product:', err)
    toast.add({ title: 'Error al cambiar producto', color: 'error', icon: 'lucide:x' })
  }
}

const handleAddCoffeeSlot = async () => {
  isAddingSlot.value = true
  try {
    const newSlot = await addCoffeeSlot(machineId)
    slots.value.push(newSlot)
  } catch(err) {
    console.error(err)
    toast.add({ title: 'Error creando insumo', color: 'error', icon: 'lucide:x' })
  } finally {
    isAddingSlot.value = false
  }
}

const handleDeleteSlot = async (id: string) => {
  slotToDeleteId.value = id
  isDeleteSlotModalOpen.value = true
}

const performDeleteSlot = async () => {
  if (!slotToDeleteId.value) return
  const id = slotToDeleteId.value
  isDeletingSlot.value = true

  const prev = [...slots.value]
  slots.value = slots.value.filter(s => s.id !== id)

  try {
    await deleteSlot(id)
    toast.add({ title: 'Insumo quitado', color: 'success', icon: 'lucide:check' })
    isDeleteSlotModalOpen.value = false
    slotToDeleteId.value = null
  } catch (e) {
    console.error(e)
    slots.value = prev
    toast.add({ title: 'Hubo un error borrando el insumo', color: 'error', icon: 'lucide:x' })
  } finally {
    isDeletingSlot.value = false
  }
}

const executeRefill = async () => {
  isRefilling.value = true

  // Optimistic UI update
  slots.value.forEach(s => {
    if (s.quantity < s.max_quantity) {
      s.quantity = s.max_quantity
    }
  })

  try {
    await refillAllSlots(machineId, slots.value)
    slots.value = await fetchSlotsForMachine(machineId)
    isRefillModalOpen.value = false
  } catch (err) {
    console.error('Error refilling:', err)
    toast.add({ title: 'Hubo un error al rellenar', color: 'error', icon: 'lucide:x' })
  } finally {
    isRefilling.value = false
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
    toast.add({ title: 'No se pudo actualizar el efectivo', color: 'error', icon: 'lucide:x' })
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
    toast.add({ title: 'Hubo un error al generar el PDF', color: 'error', icon: 'lucide:x' })
  } finally {
    isGeneratingReport.value = false
  }
}
</script>
