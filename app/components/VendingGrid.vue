<template>
  <div class="overflow-x-auto pb-4">
    <div 
      class="grid gap-3 min-w-max mx-auto"
      :style="{ gridTemplateColumns: `repeat(${columns}, minmax(100px, 1fr))` }"
    >
      <SlotCell 
        v-for="slot in sortedSlots" 
        :key="slot.id" 
        :slot="slot"
        :products="products"
        @update:qty="onUpdateQty"
        @update:product="onUpdateProduct"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Slot, Product } from '~/types'

const props = defineProps<{
  slots: Slot[],
  columns: number,
  products: Product[]
}>()

const emit = defineEmits<{
  (e: 'update:qty', id: string, newQty: number, prevQty: number): void
  (e: 'update:product', id: string, productId: string | null): void
}>()

const sortedSlots = computed(() => {
  return [...props.slots].sort((a, b) => {
    if (a.row !== b.row) return (a.row || 0) - (b.row || 0)
    return (a.col || 0) - (b.col || 0)
  })
})

const onUpdateQty = (id: string, newQty: number, prevQty: number) => {
  emit('update:qty', id, newQty, prevQty)
}

const onUpdateProduct = (id: string, productId: string | null) => {
  emit('update:product', id, productId)
}
</script>
