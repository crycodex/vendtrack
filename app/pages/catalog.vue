<template>
  <div>
    <div class="mb-4">
      <NuxtLink
        to="/"
        class="text-sm font-medium text-gray-500 hover:text-gray-900 inline-flex items-center transition-colors">
        <UIcon
          name="lucide:arrow-left"
          class="w-4 h-4 mr-1"
        />
        Volver al Dashboard
      </NuxtLink>
    </div>

    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          Catálogo Global
        </h1>
        <p class="text-gray-500">
          Bóveda central de productos e insumos disponibles para tus máquinas.
        </p>
      </div>
      <UButton color="primary" size="lg" icon="lucide:plus-circle" @click="openModal()">
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
              <th class="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Nombre del Producto
              </th>
              <th class="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th class="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th class="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Costo Compra
              </th>
              <th class="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Precio Venta
              </th>
              <th class="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Capacidad Def.
              </th>
              <th class="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                Opciones
              </th>
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
              <td class="py-4 px-5 text-sm text-gray-500 font-mono">
                {{ product.sku }}
              </td>
              <td class="py-4 px-5 text-sm text-gray-600">
                <span v-if="product.category?.name" class="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium">{{ product.category.name }}</span>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="py-4 px-5 text-sm font-medium text-gray-500">
                ${{ Number(product.purchase_price).toFixed(2) }}
              </td>
              <td class="py-4 px-5 text-sm font-bold text-gray-900">
                ${{ Number(product.sale_price).toFixed(2) }}
              </td>
              <td class="py-4 px-5 text-sm text-gray-500">
                <span class="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 font-medium">{{ product.default_max }}</span>
              </td>
              <td class="py-4 px-5 text-right">
                <div class="flex items-center justify-end gap-2">
                  <UButton color="info" variant="soft" icon="lucide:pencil" size="sm" @click="openModal(product)" title="Editar" />
                  <UButton color="error" variant="soft" icon="lucide:trash-2" size="sm" @click="confirmDelete(product)" title="Eliminar Producto" />
                </div>
              </td>
            </tr>
            <tr v-if="products.length === 0">
              <td colspan="7" class="py-16 text-center">
                <UIcon name="lucide:box" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p class="text-gray-500 font-medium">
                  El catálogo está vacío.
                </p>
                <p class="text-sm text-gray-400 mt-1">
                  Presiona "Crear Producto" para empezar a nutrir tu base de datos.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form for Create/Edit — en Nuxt UI v4 el slot default es el trigger; el panel va en #content -->
    <UModal v-model:open="isModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                <UIcon :name="editingProduct ? 'lucide:pencil' : 'lucide:plus'" class="w-5 h-5 text-gray-400" />
                {{ editingProduct ? 'Editar Producto' : 'Nuevo Producto' }}
              </h3>
              <UButton color="neutral" variant="ghost" icon="lucide:x" class="-my-1" @click="isModalOpen = false" />
            </div>
          </template>

          <form @submit.prevent="saveProduct" class="space-y-5 p-2">
            <UFormField
              label="Nombre del producto"
              description="Nombre que verás en el catálogo y en las máquinas."
              required
            >
              <UInput v-model="form.name" required placeholder="Ej. Coca Cola 600ml o Café Grano" size="lg" icon="lucide:box" />
            </UFormField>

            <UFormField
              label="Código SKU"
              description="Identificador único (no se repite entre productos)."
              required
            >
              <UInput v-model="form.sku" required placeholder="BEB-001" size="lg" icon="lucide:barcode" />
            </UFormField>

            <UFormField
              label="Categoría"
              description="Agrupa productos para filtrarlos en máquinas y reportes."
            >
              <div class="flex flex-col sm:flex-row gap-2">
                <USelectMenu
                  v-model="form.category_id"
                  :items="categorySelectOptions"
                  value-key="value"
                  label-key="label"
                  :search-input="{ placeholder: 'Buscar categoría…' }"
                  placeholder="Sin categoría"
                  size="lg"
                  class="flex-1 min-w-0"
                />
                <UButton color="neutral" variant="soft" icon="lucide:folder-plus" size="lg" @click="isCategoryModalOpen = true">
                  Nueva
                </UButton>
              </div>
            </UFormField>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField
                label="Costo de compra"
                description="Lo que te cuesta cada unidad al comprar o producir."
                required
              >
                <UInput v-model.number="form.purchase_price" type="number" step="0.01" min="0" required size="lg">
                  <template #leading>
                    <span class="text-muted font-medium">$</span>
                  </template>
                </UInput>
              </UFormField>

              <UFormField
                label="Precio de venta"
                description="Precio al que vendes cada unidad al cliente."
                required
              >
                <UInput v-model.number="form.sale_price" type="number" step="0.01" min="0" required size="lg">
                  <template #leading>
                    <span class="text-muted font-medium">$</span>
                  </template>
                </UInput>
              </UFormField>
            </div>

            <UFormField
              label="Capacidad máx. por defecto"
              hint="Por ranura"
              description="Unidades que caben habitualmente en una ranura al rellenar o al crear slots."
              required
            >
              <UInput v-model.number="form.default_max" type="number" min="1" required size="lg" icon="lucide:layers" />
            </UFormField>

            <div class="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
              <UButton color="neutral" variant="soft" @click="isModalOpen = false" size="lg" class="px-6">
                Cancelar
              </UButton>
              <UButton type="submit" color="primary" :loading="isSaving" size="lg" class="px-8">
                {{ editingProduct ? 'Actualizar' : 'Guardar' }}
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>

    <!-- Delete confirmation -->
    <UModal v-model:open="isDeleteModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                <UIcon name="lucide:trash-2" class="w-5 h-5 text-gray-400" />
                Confirmar eliminación
              </h3>
              <UButton color="neutral" variant="ghost" icon="lucide:x" class="-my-1" @click="isDeleteModalOpen = false" />
            </div>
          </template>

          <div class="p-4">
            <div class="flex gap-4">
              <div class="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                <UIcon name="lucide:alert-triangle" class="w-6 h-6 text-red-600" />
              </div>
              <div class="min-w-0">
                <p class="font-semibold text-gray-900">
                  Esta acción no se puede deshacer.
                </p>
                <p class="text-sm text-gray-500 mt-1">
                  Vas a eliminar
                  <span class="font-semibold text-gray-900">{{ deletingProduct?.name }}</span>.
                  Esto lo removerá de las configuraciones de todas las máquinas.
                </p>
              </div>
            </div>

            <div class="pt-5 mt-6 border-t border-gray-100 flex justify-end gap-3">
              <UButton color="neutral" variant="soft" @click="isDeleteModalOpen = false" :disabled="isDeleting" size="lg" class="px-6">
                Cancelar
              </UButton>
              <UButton color="error" @click="performDelete" :loading="isDeleting" size="lg" class="px-8">
                Eliminar
              </UButton>
            </div>
          </div>
        </UCard>
      </template>
    </UModal>

    <!-- Nueva categoría rápida -->
    <UModal v-model:open="isCategoryModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">
                Nueva categoría
              </h3>
              <UButton color="neutral" variant="ghost" icon="lucide:x" class="-my-1" @click="isCategoryModalOpen = false" />
            </div>
          </template>
          <div class="p-4 space-y-4">
            <UFormField label="Nombre" required>
              <UInput v-model="newCategoryName" placeholder="Ej. Bebidas energéticas" size="lg" @keydown.enter.prevent="saveNewCategory" />
            </UFormField>
            <div class="flex justify-end gap-2">
              <UButton color="neutral" variant="soft" @click="isCategoryModalOpen = false">
                Cancelar
              </UButton>
              <UButton color="primary" :loading="isSavingCategory" @click="saveNewCategory">
                Crear
              </UButton>
            </div>
          </div>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Product, Category } from '~/types'

const { fetchProducts, fetchCategories, createCategory, createProduct, updateProduct, deleteProduct } = useVendTrack()
const toast = useToast()

const pending = ref(true)
const products = ref<Product[]>([])
const categories = ref<Category[]>([])

const isCategoryModalOpen = ref(false)
const newCategoryName = ref('')
const isSavingCategory = ref(false)

const isModalOpen = ref(false)
const isSaving = ref(false)
const editingProduct = ref<Product | null>(null)

const isDeleteModalOpen = ref(false)
const deletingProduct = ref<Product | null>(null)
const isDeleting = ref(false)

const form = ref({
  name: '',
  sku: '',
  /** Vacío = sin categoría */
  category_id: '' as string,
  purchase_price: 0,
  sale_price: 0,
  default_max: 10
})

const categorySelectOptions = computed(() => {
  const base = [{ label: 'Sin categoría', value: '' }]
  return base.concat(
    categories.value.map(c => ({ label: c.name, value: c.id }))
  )
})

const upsertProduct = (p: Product) => {
  const idx = products.value.findIndex(x => x.id === p.id)
  if (idx > -1) {
    products.value[idx] = p
  } else {
    products.value.unshift(p)
  }
}

const getErrorMessage = (err: unknown) => {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: unknown }).message
    if (typeof msg === 'string' && msg.trim()) return msg
  }
  return null
}

const loadProducts = async () => {
  pending.value = true
  try {
    const [p, c] = await Promise.all([fetchProducts(), fetchCategories()])
    products.value = p
    categories.value = c
  } catch (err) {
    console.error(err)
    toast.add({
      title: 'No se pudo cargar el catálogo',
      description: 'Revisa tu conexión e inténtalo de nuevo.',
      color: 'error',
      icon: 'lucide:alert-triangle'
    })
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
      category_id: product.category_id || '',
      purchase_price: product.purchase_price || 0,
      sale_price: product.sale_price || 0,
      default_max: product.default_max || 10
    }
  } else {
    form.value = {
      name: '',
      sku: '',
      category_id: '',
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
    name: form.value.name,
    sku: form.value.sku,
    category_id: form.value.category_id ? form.value.category_id : null,
    purchase_price: Number(form.value.purchase_price) || 0,
    sale_price: Number(form.value.sale_price) || 0,
    default_max: Number(form.value.default_max) || 1
  }

  try {
    if (editingProduct.value) {
      const updated = await updateProduct(editingProduct.value.id, payload)
      upsertProduct(updated)
      toast.add({
        title: 'Producto actualizado',
        description: updated.name,
        color: 'success',
        icon: 'lucide:check'
      })
    } else {
      const created = await createProduct(payload)
      upsertProduct(created)
      toast.add({
        title: 'Producto creado',
        description: created.name,
        color: 'success',
        icon: 'lucide:check'
      })
    }
    isModalOpen.value = false
  } catch (err: unknown) {
    console.error('Error al guardar producto:', err)
    toast.add({
      title: 'No se pudo guardar',
      description: getErrorMessage(err) || 'Posiblemente el SKU ya está en uso.',
      color: 'error',
      icon: 'lucide:x'
    })
  } finally {
    isSaving.value = false
  }
}

const confirmDelete = (product: Product) => {
  deletingProduct.value = product
  isDeleteModalOpen.value = true
}

const performDelete = async () => {
  if (!deletingProduct.value) return
  isDeleting.value = true

  const target = deletingProduct.value
  const prev = [...products.value]
  products.value = products.value.filter(p => p.id !== target.id)

  try {
    await deleteProduct(target.id)
    toast.add({
      title: 'Producto eliminado',
      description: target.name,
      color: 'success',
      icon: 'lucide:check'
    })
    isDeleteModalOpen.value = false
    deletingProduct.value = null
  } catch (err: unknown) {
    console.error(err)
    products.value = prev
    toast.add({
      title: 'No se pudo eliminar',
      description: getErrorMessage(err) || 'Es posible que esté atado a un historial duro.',
      color: 'error',
      icon: 'lucide:x'
    })
  } finally {
    isDeleting.value = false
  }
}

const saveNewCategory = async () => {
  const name = newCategoryName.value.trim()
  if (!name) return
  isSavingCategory.value = true
  try {
    const created = await createCategory(name)
    categories.value = [...categories.value, created].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name))
    form.value.category_id = created.id
    newCategoryName.value = ''
    isCategoryModalOpen.value = false
    toast.add({ title: 'Categoría creada', description: created.name, color: 'success', icon: 'lucide:check' })
  } catch (e: unknown) {
    toast.add({
      title: 'No se pudo crear la categoría',
      description: getErrorMessage(e) || '¿Quizá ya existe ese nombre?',
      color: 'error',
      icon: 'lucide:x'
    })
  } finally {
    isSavingCategory.value = false
  }
}
</script>
