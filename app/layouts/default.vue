<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 font-sans">
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="text-xl font-bold tracking-tight">VendTrack</NuxtLink>
        <div class="text-sm font-medium text-gray-500">Administrador</div>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 py-8">
      <slot />
    </main>
  </div>
</template>
