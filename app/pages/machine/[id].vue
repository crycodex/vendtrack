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
            :disabled="!hasAnyProductSlots"
            @click="isRefillModalOpen = true"
          >
            Rellenar todo
          </UButton>
        </div>
      </div>

      <div class="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="lg:col-span-2 rounded-2xl border border-gray-100 bg-gradient-to-br from-slate-50/90 to-white p-5 shadow-sm">
          <h3 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <UIcon name="lucide:clipboard-list" class="w-4 h-4 text-gray-400" />
            Resumen de inventario
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p class="text-xs text-gray-500">
                Ocupación
              </p>
              <p class="text-lg font-bold text-gray-900 tabular-nums">
                {{ machineReportStats.fillPct }}%
              </p>
              <p class="text-xs text-gray-400 mt-0.5">
                {{ machineReportStats.units }} / {{ machineReportStats.cap }} uds.
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500">
                Efectivo registrado
              </p>
              <p class="text-lg font-bold text-gray-900 tabular-nums">
                ${{ Number(machine.cash_collected).toFixed(2) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500">
                Ranuras vacías
              </p>
              <p class="text-lg font-bold tabular-nums" :class="machineReportStats.empty > 0 ? 'text-amber-700' : 'text-gray-900'">
                {{ machineReportStats.empty }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500">
                Stock bajo (&lt;20%)
              </p>
              <p class="text-lg font-bold tabular-nums" :class="machineReportStats.low > 0 ? 'text-amber-700' : 'text-gray-900'">
                {{ machineReportStats.low }}
              </p>
            </div>
          </div>
        </div>
        <div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">
              Informe PDF
            </h3>
            <p class="text-xs text-gray-500 mt-1 leading-relaxed">
              Detalle por ranura (posición, producto, cantidades y alertas) más efectivo de esta máquina.
            </p>
          </div>
          <UButton
            block
            icon="lucide:download"
            color="primary"
            variant="soft"
            :loading="isGeneratingReport"
            @click="generateReport"
          >
            Descargar inventario
          </UButton>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Main Area: Grid & Local Inventory -->
        <div class="lg:col-span-3 space-y-6">
          <div class="max-w-xl">
            <UInput
              v-model="pageSearch"
              icon="lucide:search"
              placeholder="Buscar por nombre, SKU o categoría…"
              size="md"
              class="w-full"
            />
            <p v-if="pageSearch.trim()" class="text-xs text-gray-500 mt-1.5">
              Mostrando coincidencias en el catálogo de la máquina y en el resumen de inventario inferior.
            </p>
          </div>

          <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div>
                <h3 class="text-lg font-medium text-gray-900">
                  Catálogo de esta máquina
                </h3>
                <p class="text-sm text-gray-500 mt-1">
                  Solo estos productos pueden asignarse a las ranuras. El catálogo global define precios y categorías; aquí eliges qué artículos ofrece esta máquina.
                </p>
              </div>
              <div class="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto">
                <USelectMenu
                  v-model="productToAddId"
                  :items="productsNotInMachineItems"
                  value-key="value"
                  label-key="label"
                  description-key="description"
                  :filter-fields="['label', 'description']"
                  :search-input="{ placeholder: 'Buscar producto o SKU…' }"
                  placeholder="Añadir del catálogo global…"
                  size="sm"
                  class="min-w-[200px] flex-1"
                />
                <UButton size="sm" color="primary" :disabled="!productToAddId" :loading="isAddingCatalogProduct" @click="handleAddCatalogProduct">
                  Añadir
                </UButton>
                <UButton size="sm" color="neutral" variant="soft" :loading="isSyncingCatalog" @click="handleSyncCatalog">
                  Importar todos
                </UButton>
              </div>
            </div>

            <div v-if="machineCatalog.length === 0" class="py-10 text-center text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
              <UIcon name="lucide:package-search" class="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p class="font-medium text-gray-700">
                Aún no hay productos en el catálogo de esta máquina.
              </p>
              <p class="text-sm mt-1">
                Usa «Importar todos» o el selector para añadir productos del catálogo global.
              </p>
            </div>
            <div v-else-if="filteredMachineCatalog.length === 0" class="py-8 text-center text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-sm">
              Ningún producto coincide con «{{ pageSearch.trim() }}».
            </div>
            <div v-else class="overflow-x-auto rounded-lg border border-gray-100">
              <table class="w-full text-left text-sm min-w-[520px]">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-100">
                    <th class="py-2.5 px-3 font-medium text-gray-500">
                      Categoría
                    </th>
                    <th class="py-2.5 px-3 font-medium text-gray-500">
                      Producto
                    </th>
                    <th class="py-2.5 px-3 font-medium text-gray-500">
                      SKU
                    </th>
                    <th class="py-2.5 px-3 font-medium text-gray-500 text-right">
                      Quitar
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr v-for="p in filteredMachineCatalog" :key="p.id" class="hover:bg-gray-50/80">
                    <td class="py-2.5 px-3 text-gray-600">
                      <span v-if="p.category?.name" class="text-xs font-medium px-2 py-0.5 rounded-md bg-gray-100 inline-flex items-center gap-1">
                        <span v-if="p.category?.emoji">{{ p.category.emoji }}</span>
                        {{ p.category.name }}
                      </span>
                      <span v-else class="text-gray-400">—</span>
                    </td>
                    <td class="py-2.5 px-3 font-medium text-gray-900">
                      {{ p.name }}
                    </td>
                    <td class="py-2.5 px-3 font-mono text-gray-500">
                      {{ p.sku }}
                    </td>
                    <td class="py-2.5 px-3 text-right">
                      <UButton
                        icon="lucide:x"
                        size="xs"
                        color="neutral"
                        variant="ghost"
                        :loading="removingCatalogProductId === p.id"
                        @click="handleRemoveCatalogProduct(p)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

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
                :products="machineCatalog"
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
                :products="machineCatalog"
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
                <tr v-for="inv in filteredLocalInventory" :key="inv.id" class="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td class="py-3 px-4 font-medium text-gray-900">{{ inv.name }}</td>
                  <td class="py-3 px-4 text-gray-700">{{ inv.qty }} unidades</td>
                  <td class="py-3 px-4 text-gray-500">${{ (inv.qty * inv.purchase).toFixed(2) }}</td>
                </tr>
                <tr v-if="localInventory.length === 0">
                  <td colspan="3" class="py-6 text-center text-gray-500">No hay productos en esta máquina</td>
                </tr>
                <tr v-else-if="filteredLocalInventory.length === 0">
                  <td colspan="3" class="py-6 text-center text-gray-500">Ningún producto en inventario coincide con la búsqueda.</td>
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
          <p class="text-gray-500 mb-6 text-sm text-left max-w-md mx-auto">
            Solo se actualizan ranuras que ya tienen un producto asignado: se llevan al máximo de su capacidad (<span class="font-medium text-gray-700">max_quantity</span>).
            Las ranuras vacías no se modifican. Cada cambio queda registrado en el historial de stock.
          </p>
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
import { generateMachineInventoryPdf } from '~/utils/pdfReport'

const route = useRoute()
const {
  fetchMachine,
  fetchSlotsForMachine,
  updateSlotQuantity,
  refillAllSlots,
  updateCashCollected,
  fetchProducts,
  fetchMachineCatalog,
  addMachineProduct,
  removeMachineProduct,
  syncAllProductsToMachine,
  updateMachineName,
  updateSlotProduct,
  updateMachineDimensions,
  addCoffeeSlot,
  deleteSlot
} = useVendTrack()
const toast = useToast()

const machineId = route.params.id as string
const pending = ref(true)
const error = ref<Error | null>(null)
const machine = ref<Machine | null>(null)
const slots = ref<Slot[]>([])
/** Catálogo global (selector para añadir a la máquina) */
const allProducts = ref<Product[]>([])
/** Productos permitidos en esta máquina (ranuras) */
const machineCatalog = ref<Product[]>([])

const productToAddId = ref<string | undefined>(undefined)
const isAddingCatalogProduct = ref(false)
const isSyncingCatalog = ref(false)
const removingCatalogProductId = ref<string | null>(null)

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

/** Búsqueda en tablas de catálogo e inventario de esta vista */
const pageSearch = ref('')

const isDeleteSlotModalOpen = ref(false)
const slotToDeleteId = ref<string | null>(null)
const isDeletingSlot = ref(false)

const catalogIds = computed(() => new Set(machineCatalog.value.map(p => p.id)))

const matchesPageSearch = (text: string) => {
  const q = pageSearch.value.trim().toLowerCase()
  if (!q) return true
  return text.toLowerCase().includes(q)
}

const filteredMachineCatalog = computed(() => {
  const list = machineCatalog.value
  const q = pageSearch.value.trim()
  if (!q) return list
  return list.filter(p => {
    const sku = p.sku ?? ''
    const cat = p.category?.name ?? ''
    const em = p.category?.emoji ?? ''
    return (
      matchesPageSearch(p.name)
      || matchesPageSearch(sku)
      || matchesPageSearch(cat)
      || matchesPageSearch(em)
    )
  })
})

const hasAnyProductSlots = computed(() =>
  slots.value.some(s => s.product_id != null)
)

const machineReportStats = computed(() => {
  const sl = slots.value
  if (sl.length === 0) {
    return { units: 0, cap: 0, empty: 0, low: 0, fillPct: 0 }
  }
  const units = sl.reduce((a, s) => a + s.quantity, 0)
  const cap = sl.reduce((a, s) => a + s.max_quantity, 0)
  const empty = sl.filter(s => s.quantity === 0).length
  const low = sl.filter(s => s.quantity > 0 && s.quantity <= s.max_quantity * 0.2).length
  return {
    units,
    cap,
    empty,
    low,
    fillPct: cap ? Math.round((units / cap) * 100) : 0
  }
})

const productsNotInMachineItems = computed(() => {
  return allProducts.value
    .filter(p => !catalogIds.value.has(p.id))
    .map(p => ({
      value: p.id,
      label: p.category?.name
        ? `${p.name} · ${p.category.emoji ? `${p.category.emoji} ` : ''}${p.category.name}`
        : p.name,
      description: p.sku ? `SKU ${p.sku}` : undefined
    }))
})

const loadData = async () => {
  pending.value = true
  try {
    const [m_data, s_data, catalog, global] = await Promise.all([
      fetchMachine(machineId),
      fetchSlotsForMachine(machineId),
      fetchMachineCatalog(machineId),
      fetchProducts()
    ])
    machine.value = m_data
    slots.value = s_data
    machineCatalog.value = catalog
    allProducts.value = global
    productToAddId.value = undefined
    tempCash.value = Number(m_data.cash_collected) || 0
    tempRows.value = m_data.rows || 1
    tempCols.value = m_data.columns || 1
  } catch (e: unknown) {
    console.error(e)
    error.value = e instanceof Error ? e : new Error(String(e))
  } finally {
    pending.value = false
  }
}

const handleAddCatalogProduct = async () => {
  if (!productToAddId.value) return
  isAddingCatalogProduct.value = true
  try {
    await addMachineProduct(machineId, productToAddId.value)
    machineCatalog.value = await fetchMachineCatalog(machineId)
    productToAddId.value = undefined
    toast.add({ title: 'Producto añadido al catálogo de la máquina', color: 'success', icon: 'lucide:check' })
  } catch (e: unknown) {
    console.error(e)
    toast.add({ title: 'No se pudo añadir', description: e instanceof Error ? e.message : undefined, color: 'error', icon: 'lucide:x' })
  } finally {
    isAddingCatalogProduct.value = false
  }
}

const handleSyncCatalog = async () => {
  isSyncingCatalog.value = true
  try {
    const n = await syncAllProductsToMachine(machineId)
    machineCatalog.value = await fetchMachineCatalog(machineId)
    if (n === 0) {
      toast.add({ title: 'Todo el catálogo global ya estaba en esta máquina', color: 'neutral', icon: 'lucide:info' })
    } else {
      toast.add({ title: `Se añadieron ${n} producto(s) al catálogo de la máquina`, color: 'success', icon: 'lucide:check' })
    }
  } catch (e: unknown) {
    console.error(e)
    toast.add({ title: 'No se pudo importar', color: 'error', icon: 'lucide:x' })
  } finally {
    isSyncingCatalog.value = false
  }
}

const handleRemoveCatalogProduct = async (p: Product) => {
  removingCatalogProductId.value = p.id
  try {
    await removeMachineProduct(machineId, p.id)
    machineCatalog.value = machineCatalog.value.filter(x => x.id !== p.id)
    toast.add({ title: 'Producto quitado del catálogo de la máquina', color: 'success', icon: 'lucide:check' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo quitar'
    toast.add({ title: 'No se pudo quitar', description: msg, color: 'error', icon: 'lucide:x' })
  } finally {
    removingCatalogProductId.value = null
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

const filteredLocalInventory = computed(() => {
  const list = localInventory.value
  const q = pageSearch.value.trim()
  if (!q) return list
  return list.filter(inv => matchesPageSearch(inv.name))
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
  if (productId && !catalogIds.value.has(productId)) {
    toast.add({
      title: 'Producto no disponible en esta máquina',
      description: 'Añádelo primero al catálogo de la máquina arriba.',
      color: 'warning',
      icon: 'lucide:alert-triangle'
    })
    return
  }
  try {
    await updateSlotProduct(id, productId)
    const idx = slots.value.findIndex(s => s.id === id)
    const slot = idx > -1 ? slots.value[idx] : undefined
    if (slot) {
      slot.product_id = productId
      slot.product = productId
        ? machineCatalog.value.find(pr => pr.id === productId) || null
        : null
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
  try {
    const n = await refillAllSlots(machineId, slots.value)
    slots.value = await fetchSlotsForMachine(machineId)
    isRefillModalOpen.value = false
    if (n === 0) {
      toast.add({
        title: 'Nada que rellenar',
        description: 'Todas las ranuras con producto ya están llenas, o no hay productos asignados en la grilla.',
        color: 'neutral',
        icon: 'lucide:info'
      })
    } else {
      toast.add({
        title: 'Inventario actualizado',
        description: `Se llevaron ${n} ranura(s) al máximo de su capacidad.`,
        color: 'success',
        icon: 'lucide:check'
      })
    }
  } catch (err) {
    console.error('Error refilling:', err)
    toast.add({ title: 'Hubo un error al rellenar', color: 'error', icon: 'lucide:x' })
    try {
      slots.value = await fetchSlotsForMachine(machineId)
    } catch (e) {
      console.error(e)
    }
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
    generateMachineInventoryPdf(machine.value, slots.value)
    toast.add({ title: 'PDF descargado', description: `Inventario de ${machine.value.name}`, color: 'success', icon: 'lucide:check' })
  } catch (e) {
    console.error('Error generating PDF', e)
    toast.add({ title: 'Hubo un error al generar el PDF', color: 'error', icon: 'lucide:x' })
  } finally {
    isGeneratingReport.value = false
  }
}
</script>
