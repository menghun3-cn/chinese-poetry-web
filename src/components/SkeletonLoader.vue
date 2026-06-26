<template>
  <div class="space-y-6 animate-pulse">
    <section class="rounded-lg border border-[var(--color-border)] p-4 sm:p-6 lg:p-7">
      <div class="mb-6 flex items-center gap-2">
        <div class="size-4 rounded bg-[var(--color-border)]" />
        <div class="h-4 w-20 rounded bg-[var(--color-border)]" />
      </div>
      <div class="mb-3 h-8 w-72 rounded bg-[var(--color-border)]" />
      <div class="mb-6 h-5 w-96 rounded bg-[var(--color-border)]" />
      <div class="mt-8 space-y-3">
        <div v-for="i in 8" :key="i" class="h-6 rounded bg-[var(--color-border)]" :style="{ width: (60 + i * 4) + '%' }" />
      </div>
    </section>
    <div class="grid gap-4 sm:grid-cols-3">
      <div v-for="i in 3" :key="i" class="h-24 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div class="mb-2 h-4 w-16 rounded bg-[var(--color-border)]" />
        <div class="h-8 w-20 rounded bg-[var(--color-border)]" />
      </div>
    </div>
  </div>
</template>
