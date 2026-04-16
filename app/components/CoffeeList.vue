<template>
  <div class="space-y-3">
    <div 
      v-for="slot in slots" 
      :key="slot.id"
      class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl gap-4 transition-colors"
      :class="statusColor(slot)"
    >
      <div class="flex-1 w-full max-w-sm">
        <div class="flex items-center gap-2 mb-2">
          <h4 class="font-medium text-gray-900" v-if="!isExtEditing(slot.id)">{{ slot.product?.name || 'Desconocido' }}</h4>
          <USelect 
            v-else
            v-model="tempExt[slot.id].productId" 
            :options="productOptions"
            size="sm"
            class="flex-1"
          />
          <UButton 
            v-if="!isExtEditing(slot.id)" 
            icon="lucide:pencil" 
            variant="ghost" 
            size="xs" 
            color="gray"
            @click="startExtEditing(slot)"
          />
          <template v-else>
            <UButton 
              icon="lucide:x" 
              variant="ghost" 
              size="xs" 
              color="gray"
              @click="extEditingFor = null"
            />
            <UButton 
              icon="lucide:check" 
              variant="solid" 
              size="xs" 
              color="black"
              :loading="isSavingExt"
              @click="saveExt(slot)"
            />
          </template>
        </div>
        
        <div class="flex items-center gap-2" v-if="isExtEditing(slot.id)">
          <span class="text-xs text-gray-500 font-medium">Límite / Capacidad Máxima:</span>
          <UInput v-model.number="tempExt[slot.id].maxQty" type="number" min="1" size="xs" class="w-20" />
        </div>
        <span v-else class="text-sm text-gray-500">Capacidad Máxima: {{ slot.max_quantity }}</span>
      </div>
      
      <div class="flex items-center bg-white border border-gray-200 rounded-lg p-1.5 ml-auto shadow-sm">
        <UButton icon="lucide:minus" size="sm" variant="ghost" color="gray" @click="decSlot(slot)" :disabled="slot.quantity <= 0" />
        <span class="font-bold text-lg w-12 text-center text-gray-900">{{ slot.quantity }}</span>
        <UButton icon="lucide:plus" size="sm" variant="ghost" color="gray" @click="incSlot(slot)" :disabled="slot.quantity >= slot.max_quantity" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Slot, Product } from '~/types'

const props = defineProps<{
  slots: Slot[],
  products: Product[]
}>()

const emit = defineEmits<{
  (e: 'update:qty', id: string, newQty: number, prevQty: number): void
  (e: 'update:product', id: string, productId: string | null): void
}>()

const { updateSlotMaxQuantity } = useVendTrack()
const extEditingFor = ref<string | null>(null)
const isSavingExt = ref(false)
const tempExt = ref<Record<string, { productId: string, maxQty: number }>>({})

const productOptions = computed(() => {
  const opts = [{ label: 'Vacío', value: '' }]
  props.products.forEach(p => {
    opts.push({ label: p.name, value: p.id })
  })
  return opts
})

const statusColor = (slot: Slot) => {
  if (slot.quantity === 0) return 'bg-red-50 border-red-100'
  if (slot.quantity <= slot.max_quantity * 0.2) return 'bg-yellow-50 border-yellow-100'
  return 'bg-white border-gray-200'
}

const incSlot = (slot: Slot) => {
  if (slot.quantity < slot.max_quantity) {
    emit('update:qty', slot.id, slot.quantity + 1, slot.quantity)
  }
}

const decSlot = (slot: Slot) => {
  if (slot.quantity > 0) {
    emit('update:qty', slot.id, slot.quantity - 1, slot.quantity)
  }
}

const isExtEditing = (id: string) => extEditingFor.value === id

const startExtEditing = (slot: Slot) => {
  extEditingFor.value = slot.id
  if (!tempExt.value[slot.id]) {
    tempExt.value[slot.id] = { productId: '', maxQty: 0 }
  }
  tempExt.value[slot.id].productId = slot.product_id || ''
  tempExt.value[slot.id].maxQty = slot.max_quantity
}

const saveExt = async (slot: Slot) => {
  const data = tempExt.value[slot.id]
  isSavingExt.value = true
  
  if (data.maxQty !== slot.max_quantity) {
    try {
      await updateSlotMaxQuantity(slot.id, data.maxQty)
      slot.max_quantity = data.maxQty
    } catch(err) {
      alert("Error actualizando capacidad de insumo")
    }
  }

  if (data.productId !== (slot.product_id || '')) {
    emit('update:product', slot.id, data.productId === '' ? null : data.productId)
  }
  
  isSavingExt.value = false
  extEditingFor.value = null
}
</script>
