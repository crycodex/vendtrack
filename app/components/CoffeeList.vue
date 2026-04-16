<template>
  <div class="space-y-3">
    <div 
      v-for="slot in slots" 
      :key="slot.id"
      class="flex items-center justify-between p-4 border rounded-xl"
      :class="statusColor(slot)"
    >
      <div class="flex-1">
        <h4 class="font-medium text-gray-900">{{ slot.product?.name || 'Desconocido' }}</h4>
        <span class="text-sm text-gray-500">Máx: {{ slot.max_quantity }}</span>
      </div>
      
      <div class="flex items-center space-x-4">
        <div class="w-24">
          <UInput 
            v-model.number="localQtys[slot.id]" 
            type="number" 
            min="0" 
            :max="slot.max_quantity"
            size="md"
            class="text-right"
            @blur="saveValue(slot)"
            @keydown.enter="saveValue(slot)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Slot } from '~/types'

const props = defineProps<{
  slots: Slot[]
}>()

const emit = defineEmits<{
  (e: 'update:qty', id: string, newQty: number, prevQty: number): void
}>()

const localQtys = ref<Record<string, number>>({})

watch(() => props.slots, (newSlots) => {
  newSlots.forEach(s => {
    // Only update if not currently focused / manually edited, or initialize
    if (localQtys.value[s.id] === undefined) {
      localQtys.value[s.id] = s.quantity
    }
  })
}, { immediate: true, deep: true })

const statusColor = (slot: Slot) => {
  if (slot.quantity === 0) return 'bg-red-50 border-red-100'
  if (slot.quantity <= slot.max_quantity * 0.2) return 'bg-yellow-50 border-yellow-100'
  return 'bg-white border-gray-200'
}

const saveValue = (slot: Slot) => {
  const newVal = localQtys.value[slot.id]
  if (newVal !== slot.quantity && newVal >= 0 && newVal <= slot.max_quantity) {
    emit('update:qty', slot.id, newVal, slot.quantity)
  } else {
    localQtys.value[slot.id] = slot.quantity // Reset if invalid
  }
}
</script>
