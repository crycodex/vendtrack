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
      <UButton color="black" icon="lucide:plus" @click="openModal()">
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
            <th class="py-3 px-4 text-sm font-medium text-gray-500">Costo Compra</th>
            <th class="py-3 px-4 text-sm font-medium text-gray-500">Costo Venta</th>
            <th class="py-3 px-4 text-sm font-medium text-gray-500">Máx. Defecto</th>
            <th class="py-3 px-4 text-sm font-medium text-gray-500 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id" class="border-b border-gray-100 last:border-0 hover:bg-gray-50">
            <td class="py-3 px-4 font-medium text-gray-900">{{ product.name }}</td>
            <td class="py-3 px-4 text-sm text-gray-500">{{ product.sku }}</td>
            <td class="py-3 px-4 text-sm text-gray-500">${{ Number(product.purchase_price).toFixed(2) }}</td>
            <td class="py-3 px-4 text-sm text-gray-700 font-medium">${{ Number(product.sale_price).toFixed(2) }}</td>
            <td class="py-3 px-4 text-sm text-gray-500">{{ product.default_max }}</td>
            <td class="py-3 px-4 text-right">
              <UButton color="gray" variant="ghost" icon="lucide:edit-2" size="sm" @click="openModal(product)" />
            </td>
          </tr>
          <tr v-if="products.length === 0">
            <td colspan="6" class="py-8 text-center text-gray-500">No hay productos registrados</td>
          </tr>
        </tbody>
      </table>
    </div>

    <UModal v-model="isModalOpen">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editingProduct ? 'Editar Producto' : 'Nuevo Producto' }}</h3>
        
        <form @submit.prevent="saveProduct" class="space-y-4">
          <UFormGroup label="Nombre">
            <UInput v-model="form.name" required placeholder="Ej. Coca Cola 600ml" />
          </UFormGroup>
          
          <UFormGroup label="SKU">
            <UInput v-model="form.sku" required placeholder="COCA-600" />
          </UFormGroup>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Costo de Compra ($)">
              <UInput v-model.number="form.purchase_price" type="number" step="0.01" min="0" required />
            </UFormGroup>
            
            <UFormGroup label="Costo de Venta ($)">
              <UInput v-model.number="form.sale_price" type="number" step="0.01" min="0" required />
            </UFormGroup>
          </div>
          
          <UFormGroup label="Stock Máximo por Defecto">
            <UInput v-model.number="form.default_max" type="number" min="1" required />
          </UFormGroup>

          <div class="flex justify-end gap-3 mt-6">
            <UButton color="gray" variant="soft" @click="isModalOpen = false">Cancelar</UButton>
            <UButton type="submit" color="black" :loading="isSaving">Guardar</UButton>
          </div>
        </form>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/types'

const { fetchProducts, createProduct, updateProduct } = useVendTrack()

const pending = ref(true)
const products = ref<Product[]>([])

const isModalOpen = ref(false)
const isSaving = ref(false)
const editingProduct = ref<Product | null>(null)

const form = ref({
  name: '',
  sku: '',
  purchase_price: 0,
  sale_price: 0,
  default_max: 10
})

const loadProducts = async () => {
  pending.value = true
  try {
    products.value = await fetchProducts()
  } catch (err) {
    console.error(err)
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  loadProducts()
})

const openModal = (product?: Product) => {
  editingProduct.value = product || null
  if (product) {
    form.value = {
      name: product.name,
      sku: product.sku,
      purchase_price: product.purchase_price || 0,
      sale_price: product.sale_price || 0,
      default_max: product.default_max || 10
    }
  } else {
    form.value = {
      name: '',
      sku: '',
      purchase_price: 0,
      sale_price: 0,
      default_max: 10
    }
  }
  isModalOpen.value = true
}

const saveProduct = async () => {
  isSaving.value = true
  try {
    if (editingProduct.value) {
      await updateProduct(editingProduct.value.id, form.value)
    } else {
      await createProduct(form.value)
    }
    isModalOpen.value = false
    await loadProducts()
  } catch (err: any) {
    console.error('Error al guardar producto:', err)
    alert(err?.message || 'Error al guardar')
  } finally {
    isSaving.value = false
  }
}
</script>
