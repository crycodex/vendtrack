<template>
  <div 
    class="relative border rounded-lg p-3 flex flex-col items-center justify-center min-h-[100px] transition-colors"
    :class="[
      statusColor,
      isEditing ? 'ring-2 ring-black border-transparent' : 'border-gray-200 cursor-pointer hover:border-gray-300'
    ]"
    @click="startEditing"
  >
    <div class="absolute top-1 left-1.5 text-xs text-gray-500 font-medium">
      {{ slot.row }}-{{ slot.col }}
    </div>

    <div class="text-center w-full capitalize font-medium text-sm text-gray-800 line-clamp-2 leading-tight mt-2 mb-2">
      {{ slot.product?.name || 'Vacío' }}
    </div>
    
    <div v-if="!isEditing" class="font-bold text-gray-900 mt-auto">
      {{ slot.quantity }} / {{ slot.max_quantity }}
    </div>

    <div v-else class="mt-auto w-full px-1" @click.stop>
      <UInput 
        ref="inputRef"
        v-model.number="tempQuantity" 
        type="number" 
        min="0" 
        :max="slot.max_quantity"
        size="xs"
        class="text-center"
        @blur="saveValue"
        @keydown.enter="saveValue"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Slot } from '~/types'

const props = defineProps<{
  slot: Slot
}>()

const emit = defineEmits<{
  (e: 'update:qty', id: string, newQty: number, prevQty: number): void
}>()

const isEditing = ref(false)
const tempQuantity = ref(props.slot.quantity)
const inputRef = ref<any>(null)

const statusColor = computed(() => {
  if (props.slot.quantity === 0) return 'bg-red-50 border-red-100'
  if (props.slot.quantity <= props.slot.max_quantity * 0.2) return 'bg-yellow-50 border-yellow-100'
  return 'bg-gray-50'
})

const startEditing = () => {
  isEditing.value = true
  tempQuantity.value = props.slot.quantity
  nextTick(() => {
    inputRef.value?.input?.focus()
  })
}

const saveValue = () => {
  if (!isEditing.value) return
  isEditing.value = false
  
  if (tempQuantity.value !== props.slot.quantity && tempQuantity.value >= 0 && tempQuantity.value <= props.slot.max_quantity) {
    emit('update:qty', props.slot.id, tempQuantity.value, props.slot.quantity)
  } else {
    // Reset if invalid or unchanged
    tempQuantity.value = props.slot.quantity
  }
}

watch(() => props.slot.quantity, (newVal) => {
  if (!isEditing.value) {
    tempQuantity.value = newVal
  }
})
</script>
