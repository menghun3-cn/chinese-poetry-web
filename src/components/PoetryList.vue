<template>
  <section
    class="min-h-[420px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
    aria-label="诗词列表"
  >
    <header class="flex items-center justify-between border-b border-[var(--color-border)] p-4">
      <div>
        <h2 class="text-base font-semibold">检索结果</h2>
        <p class="mt-1 text-sm text-[var(--color-text-muted)]">
          {{ store.filteredItems.length }} 首作品
        </p>
      </div>
      <ListFilter class="size-5 text-[var(--color-text-muted)]" aria-hidden="true" />
    </header>

    <div class="max-h-[680px] overflow-y-auto p-2">
      <button
        v-for="item in store.filteredItems.slice(0, 120)"
        :key="item.id"
        class="mb-2 block w-full rounded-lg border p-3 text-left transition"
        :class="
          store.selectedItem?.id === item.id
            ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
            : 'border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]'
        "
        @click="store.selectItem(item.id)"
      >
        <span class="flex items-start justify-between gap-3">
          <span class="min-w-0">
            <span class="block truncate text-sm font-semibold">{{ item.title }}</span>
            <span class="mt-1 block text-xs text-[var(--color-text-muted)]">
              {{ item.dynasty }} · {{ item.author }} · {{ item.collection }}
            </span>
          </span>
          <AppBadge v-if="item.tags[0]" tone="accent" class="shrink-0">{{ item.tags[0] }}</AppBadge>
        </span>
        <span class="mt-2 line-clamp-2 block text-sm leading-6 text-[var(--color-text-secondary)]">
          {{ item.excerpt }}
        </span>
      </button>

      <p
        v-if="store.filteredItems.length > 120"
        class="px-2 py-3 text-center text-xs text-[var(--color-text-muted)]"
      >
        已展示前 120 首，请继续缩小筛选条件。
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ListFilter } from 'lucide-vue-next'

import AppBadge from '@/components/ui/AppBadge.vue'
import { usePoetryStore } from '@/stores/poetry'

const store = usePoetryStore()
</script>
