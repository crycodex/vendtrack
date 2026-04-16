<template>
  <div>
    <div class="mb-4">
      <NuxtLink to="/" class="text-sm font-medium text-gray-500 hover:text-gray-900 inline-flex items-center transition-colors">
        <UIcon name="lucide:arrow-left" class="w-4 h-4 mr-1" />
        Volver al Dashboard
      </NuxtLink>
    </div>

    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          Catálogo Global
        </h1>
        <p class="text-gray-500">Bóveda central de productos e insumos disponibles para tus máquinas.</p>
      </div>
      <UButton color="black" size="lg" icon="lucide:plus-circle" @click="openModal()">
        Crear Producto
      </UButton>
    </div>

    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="lucide:loader-2" class="w-8 h-8 animate-spin text-gray-400" />
    </div>

    <!-- Product Table -->
    <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre del Producto</th>
              <th class="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
              <th class="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Costo Compra</th>
              <th class="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio Venta</th>
              <th class="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Capacidad Def.</th>
              <th class="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Opciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="product in products" :key="product.id" class="hover:bg-gray-50/50 transition-colors">
              <td class="py-4 px-5">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                    <UIcon name="lucide:package" class="w-5 h-5 text-gray-400" />
                  </div>
                  <span class="font-semibold text-gray-900">{{ product.name }}</span>
                </div>
              </td>
              <td class="py-4 px-5 text-sm text-gray-500 font-mono">{{ product.sku }}</td>
              <td class="py-4 px-5 text-sm font-medium text-gray-500">${{ Number(product.purchase_price).toFixed(2) }}</td>
              <td class="py-4 px-5 text-sm font-bold text-gray-900">${{ Number(product.sale_price).toFixed(2) }}</td>
              <td class="py-4 px-5 text-sm text-gray-500">
                <span class="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 font-medium">{{ product.default_max }}</span>
              </td>
              <td class="py-4 px-5 text-right">
                <div class="flex items-center justify-end gap-2">
                  <UButton color="blue" variant="soft" icon="lucide:pencil" size="sm" @click="openModal(product)" title="Editar" />
                  <UButton color="red" variant="soft" icon="lucide:trash-2" size="sm" @click="confirmDelete(product)" title="Eliminar Producto" />
                </div>
              </td>
            </tr>
            <tr v-if="products.length === 0">
              <td colspan="6" class="py-16 text-center">
                <UIcon name="lucide:box" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p class="text-gray-500 font-medium">El catálogo está vacío.</p>
                <p class="text-sm text-gray-400 mt-1">Presiona "Crear Producto" para empezar a nutrir tu base de datos.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form for Create/Edit -->
    <UModal v-model="isModalOpen">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2">
              <UIcon :name="editingProduct ? 'lucide:pencil' : 'lucide:plus'" class="w-5 h-5 text-gray-400" />
              {{ editingProduct ? 'Editar Producto' : 'Nuevo Producto' }}
            </h3>
            <UButton color="gray" variant="ghost" icon="lucide:x" class="-my-1" @click="isModalOpen = false" />
          </div>
        </template>
        
        <form @submit.prevent="saveProduct" class="space-y-5 p-2">
          <UFormGroup label="Nombre del Producto">
            <UInput v-model="form.name" required placeholder="Ej. Coca Cola 600ml o Café Grano" size="lg" icon="lucide:box" />
          </UFormGroup>
          
          <UFormGroup label="Código SKU">
            <UInput v-model="form.sku" required placeholder="BEB-001" size="lg" icon="lucide:barcode" />
          </UFormGroup>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Costo Compra ($)">
              <UInput v-model.number="form.purchase_price" type="number" step="0.01" min="0" required size="lg">
                <template #leading><span class="text-gray-500 font-medium">$</span></template>
              </UInput>
            </UFormGroup>
            
            <UFormGroup label="Precio Venta ($)">
              <UInput v-model.number="form.sale_price" type="number" step="0.01" min="0" required size="lg">
                <template #leading><span class="text-gray-500 font-medium">$</span></template>
              </UInput>
            </UFormGroup>
          </div>
          
          <UFormGroup label="Stock Máx. por Defecto">
            <template #hint>
              <span class="text-xs text-gray-500">¿Cuánto cabe usualmente en una ranura?</span>
            </template>
            <UInput v-model.number="form.default_max" type="number" min="1" required size="lg" icon="lucide:layers" />
          </UFormGroup>

          <div class="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <UButton color="gray" variant="soft" @click="isModalOpen = false" size="lg" class="px-6">Cancelar</UButton>
            <UButton type="submit" color="black" :loading="isSaving" size="lg" class="px-8">
              {{ editingProduct ? 'Actualizar' : 'Guardar' }}
            </UButton>
          </div>
        </form>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/types'

const { fetchProducts, createProduct, updateProduct, deleteProduct } = useVendTrack()

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

  const payload = {
    ...form.value,
    purchase_price: Number(form.value.purchase_price) || 0,
    sale_price: Number(form.value.sale_price) || 0,
    default_max: Number(form.value.default_max) || 1
  }

  try {
    if (editingProduct.value) {
      await updateProduct(editingProduct.value.id, payload)
    } else {
      await createProduct(payload)
    }
    isModalOpen.value = false
    await loadProducts()
  } catch (err: any) {
    console.error('Error al guardar producto:', err)
    alert(err?.message || 'Error al guardar. Posiblemente el SKU ya está en uso.')
  } finally {
    isSaving.value = false
  }
}

const confirmDelete = async (product: Product) => {
  if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente "${product.name}"? Esto lo removerá de las configuraciones de todas las máquinas y no se puede deshacer.`)) return
  
  try {
    await deleteProduct(product.id)
    await loadProducts()
  } catch (err: any) {
    console.error(err)
    alert('Hubo un error borrando el producto. Es posible que esté atado a un historial duro.')
  }
}
</script>
