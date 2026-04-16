<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
    <div class="flex justify-between items-start mb-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">{{ machine.name }}</h3>
        <span class="text-sm text-gray-500 capitalize">{{ machine.type }}</span>
      </div>
      <div 
        class="w-10 h-10 rounded-full flex items-center justify-center"
        :class="machine.type === 'vending' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'"
      >
        <UIcon v-if="machine.type === 'vending'" name="lucide:box" class="w-5 h-5" />
        <UIcon v-else name="lucide:coffee" class="w-5 h-5" />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4 mb-4">
      <div>
        <p class="text-sm text-gray-500 mb-1">Ocupación</p>
        <p class="font-medium text-gray-900">{{ occupancyPercentage }}%</p>
      </div>
      <div>
        <p class="text-sm text-gray-500 mb-1">Efectivo</p>
        <p class="font-medium text-gray-900">${{ machine.cash_collected }}</p>
      </div>
    </div>

    <div v-if="alerts.length > 0" class="mb-4">
      <div v-for="(alert, idx) in alerts" :key="idx" class="flex items-center text-red-600 text-sm mb-1">
        <UIcon name="lucide:alert-circle" class="w-4 h-4 mr-1.5" />
        <span>{{ alert }}</span>
      </div>
    </div>

    <UButton 
      block 
      color="neutral"
      variant="outline"
      :to="`/machine/${machine.id}`"
    >
      Ver Detalles
    </UButton>
  </div>
</template>

<script setup lang="ts">
import type { Machine, Slot } from '~/types'

const props = defineProps<{
  machine: Machine,
  slots: Slot[]
}>()

const totalCapacity = computed(() => {
  return props.slots.reduce((acc, slot) => acc + slot.max_quantity, 0)
})

const currentStock = computed(() => {
  return props.slots.reduce((acc, slot) => acc + slot.quantity, 0)
})

const occupancyPercentage = computed(() => {
  if (totalCapacity.value === 0) return 0
  return Math.round((currentStock.value / totalCapacity.value) * 100)
})

const alerts = computed(() => {
  const result = []
  const emptyCount = props.slots.filter(s => s.quantity === 0).length
  if (emptyCount > 0) result.push(`${emptyCount} ranura(s) vacía(s)`)

  const lowCount = props.slots.filter(s => s.quantity > 0 && s.quantity <= (s.max_quantity * 0.2)).length
  if (lowCount > 0) result.push(`${lowCount} ranura(s) por agotarse`)

  return result
})
</script>
