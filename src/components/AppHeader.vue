<template>
  <header class="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
    <div class="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
      <RouterLink to="/" class="flex min-h-11 items-center gap-3" aria-label="返回诗屿首页">
        <span
          class="flex size-10 items-center justify-center rounded-lg bg-[var(--color-surface-strong)] text-white"
        >
          <BookOpenText class="size-5" aria-hidden="true" />
        </span>
        <span>
          <span class="block text-base font-semibold leading-tight">诗屿</span>
          <span class="block text-xs text-[var(--color-text-muted)]">中文诗词阅读</span>
        </span>
      </RouterLink>

      <nav class="flex items-center gap-2" aria-label="主导航">
        <RouterLink
          to="/"
          class="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-muted)]"
          active-class="bg-[var(--color-primary-soft)] text-[var(--color-primary-hover)]"
        >
          阅读
        </RouterLink>
        <RouterLink
          to="/insights"
          class="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-muted)]"
          active-class="bg-[var(--color-primary-soft)] text-[var(--color-primary-hover)]"
        >
          数据
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { BookOpenText } from 'lucide-vue-next'
</script>
