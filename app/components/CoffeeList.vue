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
          <USelectMenu 
            v-else
            v-model="getTempExt(slot.id).productId" 
            :options="productOptions"
            value-attribute="value"
            option-attribute="label"
            placeholder="Asignar producto..."
            size="sm"
            class="flex-1"
          />
          <UButton 
            v-if="!isExtEditing(slot.id)" 
            icon="lucide:pencil" 
            variant="ghost" 
            size="xs" 
            color="neutral"
            @click="startExtEditing(slot)"
          />
          <template v-else>
            <UButton 
              icon="lucide:x" 
              variant="ghost" 
              size="xs" 
              color="neutral"
              @click="extEditingFor = null"
            />
            <UButton 
              icon="lucide:check" 
              variant="solid" 
              size="xs" 
              color="primary"
              :loading="isSavingExt"
              @click="saveExt(slot)"
            />
          </template>
        </div>
        
        <div class="flex items-center gap-2" v-if="isExtEditing(slot.id)">
          <span class="text-xs text-gray-500 font-medium">Límite / Capacidad Máxima:</span>
          <UInput v-model.number="getTempExt(slot.id).maxQty" type="number" min="1" size="xs" class="w-20" />
        </div>
        <span v-else class="text-sm text-gray-500">Capacidad Máxima: {{ slot.max_quantity }}</span>
      </div>
      
      <div class="flex items-center gap-3 ml-auto">
        <div class="flex items-center bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm">
          <UButton icon="lucide:minus" size="sm" variant="ghost" color="neutral" @click="decSlot(slot)" :disabled="slot.quantity <= 0" />
          <span class="font-bold text-lg w-12 text-center text-gray-900">{{ slot.quantity }}</span>
          <UButton icon="lucide:plus" size="sm" variant="ghost" color="neutral" @click="incSlot(slot)" :disabled="slot.quantity >= slot.max_quantity" />
        </div>
        <UButton 
          icon="lucide:trash-2" 
          size="sm" 
          variant="soft" 
          color="error" 
          title="Eliminar este módulo"
          @click="emit('delete:slot', slot.id)" 
        />
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
  (e: 'delete:slot', id: string): void
}>()

const { updateSlotMaxQuantity } = useVendTrack()
const toast = useToast()
const extEditingFor = ref<string | null>(null)
const isSavingExt = ref(false)
const tempExt = ref<Record<string, { productId: string, maxQty: number }>>({})

const productOptions = computed(() => {
  const opts = [{ label: 'Vacío', value: '' }]
  props.products.forEach((p) => {
    const tag = p.category?.name ? ` · ${p.category.name}` : ''
    opts.push({ label: `${p.name}${tag}`, value: p.id })
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

const getTempExt = (id: string) => {
  if (!tempExt.value[id]) tempExt.value[id] = { productId: '', maxQty: 0 }
  return tempExt.value[id]
}

const startExtEditing = (slot: Slot) => {
  extEditingFor.value = slot.id
  const temp = getTempExt(slot.id)
  temp.productId = slot.product_id || ''
  temp.maxQty = slot.max_quantity
}

const saveExt = async (slot: Slot) => {
  const data = getTempExt(slot.id)
  isSavingExt.value = true
  
  if (data.maxQty !== slot.max_quantity) {
    try {
      await updateSlotMaxQuantity(slot.id, data.maxQty)
      slot.max_quantity = data.maxQty
    } catch(err) {
      toast.add({ title: 'Error actualizando capacidad', color: 'error', icon: 'lucide:x' })
    }
  }

  if (data.productId !== (slot.product_id || '')) {
    emit('update:product', slot.id, data.productId === '' ? null : data.productId)
  }
  
  isSavingExt.value = false
  extEditingFor.value = null
}
</script>
