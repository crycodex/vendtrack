<template>
  <div 
    class="relative border rounded-lg p-3 flex flex-col items-center justify-center min-h-[140px] transition-colors"
    :class="[
      statusColor,
      isEditing ? 'ring-2 ring-black border-transparent bg-white shadow-xl z-20 scale-105' : 'border-gray-200 cursor-pointer hover:border-gray-300'
    ]"
    @click="startEditing"
  >
    <div class="absolute top-1 left-1.5 text-xs text-gray-500 font-medium z-10 bg-white/80 px-1 rounded shadow-sm">
      {{ slot.row }}-{{ slot.col }}
    </div>

    <template v-if="!isEditing">
      <div class="text-center w-full capitalize font-medium text-sm text-gray-800 line-clamp-2 leading-tight mt-2 mb-2">
        {{ slot.product?.name || 'Vacío' }}
      </div>
      <div class="font-bold text-gray-900 mt-auto">
        {{ slot.quantity }} / {{ slot.max_quantity }}
      </div>
    </template>

    <template v-else>
      <div class="mt-4 w-full space-y-3" @click.stop>
        
        <USelectMenu
          v-model="tempProductId"
          :items="productMenuItems"
          value-key="value"
          label-key="label"
          description-key="description"
          :filter-fields="['label', 'description']"
          :search-input="{ placeholder: 'Buscar por nombre o SKU…' }"
          placeholder="Asignar producto del catálogo…"
          size="sm"
          class="w-full min-w-[200px] max-w-full relative z-50"
        />

        <div class="flex flex-col items-center gap-1 bg-gray-50 p-2 rounded-md border border-gray-100">
           <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Inventario</span>
           <div class="flex items-center gap-2">
             <UButton icon="lucide:minus" size="xs" variant="soft" color="neutral" @click="dec" :disabled="tempQuantity <= 0" />
             <span class="font-bold text-base w-6 text-center">{{ tempQuantity }}</span>
             <UButton icon="lucide:plus" size="xs" variant="soft" color="neutral" @click="inc" :disabled="tempQuantity >= tempMax" />
           </div>
        </div>

        <div class="flex items-center justify-between gap-2 px-1">
          <span class="text-xs text-gray-500 font-medium tracking-tight">Capacidad:</span>
          <UInput v-model.number="tempMax" type="number" min="1" size="xs" class="w-14" :padded="false" input-class="text-center" />
        </div>

        <div class="flex gap-2">
           <UButton block label="Cancelar" size="xs" color="neutral" variant="soft" class="flex-1" @click="cancel" />
           <UButton block label="Guardar" size="xs" color="primary" class="flex-1" @click="saveValue" :loading="isSaving" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Slot, Product } from '~/types'

const props = defineProps<{
  slot: Slot,
  products: Product[]
}>()

const emit = defineEmits<{
  (e: 'update:qty', id: string, newQty: number, prevQty: number): void
  (e: 'update:product', id: string, productId: string | null): void
}>()

const { updateSlotMaxQuantity } = useVendTrack()
const toast = useToast()

const isEditing = ref(false)
const isSaving = ref(false)

const tempQuantity = ref(props.slot.quantity)
const tempProductId = ref(props.slot.product_id || '')
const tempMax = ref(props.slot.max_quantity)

const statusColor = computed(() => {
  if (props.slot.quantity === 0) return 'bg-red-50 border-red-100'
  if (props.slot.quantity <= props.slot.max_quantity * 0.2) return 'bg-yellow-50 border-yellow-100'
  return 'bg-gray-50'
})

/** Items para USelectMenu v4: `items` + búsqueda en label/description (nombre, categoría, SKU) */
const productMenuItems = computed(() => {
  const rows: { label: string, value: string, description?: string }[] = [
    { label: 'Vacío', value: '', description: 'Sin producto asignado' }
  ]
  for (const p of props.products) {
    const tag = p.category?.name ? ` · ${p.category.name}` : ''
    rows.push({
      label: `${p.name}${tag}`,
      value: p.id,
      description: p.sku ? `SKU ${p.sku}` : undefined
    })
  }
  return rows
})

const startEditing = () => {
  if (isEditing.value) return 
  isEditing.value = true
  tempQuantity.value = props.slot.quantity
  tempMax.value = props.slot.max_quantity
  tempProductId.value = props.slot.product_id || ''
}

const cancel = () => {
  isEditing.value = false
}

const inc = () => { if (tempQuantity.value < tempMax.value) tempQuantity.value++ }
const dec = () => { if (tempQuantity.value > 0) tempQuantity.value-- }

const saveValue = async () => {
  isSaving.value = true
  
  if (tempMax.value !== props.slot.max_quantity) {
    try {
      await updateSlotMaxQuantity(props.slot.id, tempMax.value)
      // optimistic
      props.slot.max_quantity = tempMax.value
    } catch (e) {
      toast.add({ title: 'Error actualizando máxima capacidad', color: 'error', icon: 'lucide:x' })
    }
  }

  if (tempProductId.value !== (props.slot.product_id || '')) {
    emit('update:product', props.slot.id, tempProductId.value === '' ? null : tempProductId.value)
  }

  if (tempQuantity.value !== props.slot.quantity) {
    emit('update:qty', props.slot.id, tempQuantity.value, props.slot.quantity)
  }
  
  isSaving.value = false
  isEditing.value = false
}

watch(() => props.slot.quantity, (newVal) => {
  if (!isEditing.value) tempQuantity.value = newVal
})
watch(() => props.slot.product_id, (newVal) => {
  if (!isEditing.value) tempProductId.value = newVal || ''
})
watch(() => props.slot.max_quantity, (newVal) => {
  if (!isEditing.value) tempMax.value = newVal
})
</script>
