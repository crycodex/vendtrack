<template>
  <div>
    <div class="mb-4">
      <NuxtLink to="/" class="text-sm font-medium text-gray-500 hover:text-gray-900 inline-flex items-center">
        <UIcon name="lucide:arrow-left" class="w-4 h-4 mr-1" />
        Volver al Dashboard
      </NuxtLink>
    </div>

    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-1">Catálogo de Productos</h1>
        <p class="text-gray-500">Administra los productos disponibles para las máquinas</p>
      </div>
      <!-- Add product button (not functional for now unless implemented fully) -->
      <UButton color="black" icon="lucide:plus">
        Nuevo Producto
      </UButton>
    </div>

    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="lucide:loader-2" class="w-8 h-8 animate-spin text-gray-400" />
    </div>

    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-200">
            <th class="py-3 px-4 text-sm font-medium text-gray-500">Nombre</th>
            <th class="py-3 px-4 text-sm font-medium text-gray-500">SKU</th>
            <th class="py-3 px-4 text-sm font-medium text-gray-500">Máx. Defecto</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id" class="border-b border-gray-100 last:border-0 hover:bg-gray-50">
            <td class="py-3 px-4 font-medium text-gray-900">{{ product.name }}</td>
            <td class="py-3 px-4 text-sm text-gray-500">{{ product.sku }}</td>
            <td class="py-3 px-4 text-sm text-gray-500">{{ product.default_max }}</td>
          </tr>
          <tr v-if="products.length === 0">
            <td colspan="3" class="py-8 text-center text-gray-500">No hay productos registrados</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/types'

const { fetchProducts } = useVendTrack()

const pending = ref(true)
const products = ref<Product[]>([])

onMounted(async () => {
  try {
    products.value = await fetchProducts()
  } catch (err) {
    console.error(err)
  } finally {
    pending.value = false
  }
})
</script>
