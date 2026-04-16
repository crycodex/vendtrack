<template>
  <div class="min-h-screen bg-white text-gray-900 font-sans">
    <UApp>
      <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div class="flex items-center gap-6">
            <NuxtLink to="/" class="text-xl font-bold tracking-tight">VendTrack</NuxtLink>
            <NuxtLink to="/catalog" class="text-sm font-medium text-gray-500 hover:text-gray-900" active-class="text-gray-900 font-semibold">Catálogo</NuxtLink>
          </div>
          <div class="text-sm font-medium text-gray-500">Administrador</div>
        </div>
      </header>

      <main class="max-w-5xl mx-auto px-4 py-8">
        <NuxtPage />
      </main>

      <UColorModeButton class="sr-only" />
    </UApp>
  </div>
</template>

<script setup>
useHead({
  title: 'VendTrack - Inventario',
  htmlAttrs: { lang: 'es' }
})
</script>
