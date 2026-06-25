<template>
  <div class="min-h-screen bg-[var(--color-page)] text-[var(--color-text)]">
    <AppHeader />
    <main class="mx-auto w-full max-w-[1440px] px-4 pb-12 pt-5 sm:px-6 lg:px-8">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
</script>
