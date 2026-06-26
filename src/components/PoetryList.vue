<template>
  <section
    class="min-h-[420px] min-w-0 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
    aria-label="诗词列表"
  >
    <header class="flex items-start justify-between gap-4 border-b border-[var(--color-border)] p-4">
      <div class="min-w-0">
        <p class="flex items-center gap-2 text-xs font-medium text-[var(--color-accent)]">
          <ListFilter class="size-4" aria-hidden="true" />
          篇目
        </p>
        <h2 class="mt-1 text-base font-semibold">检索结果</h2>
        <p class="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
          共 {{ store.filteredItems.length }} 首，当前展示前 {{ visibleCount }} 首
        </p>
      </div>
      <span class="shrink-0 rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
        点击切换
      </span>
    </header>

    <div class="max-h-[720px] overflow-y-auto p-2">
      <button
        v-for="(item, index) in store.filteredItems.slice(0, visibleCount)"
        :key="item.id"
        class="mb-2 block min-h-[92px] w-full min-w-0 rounded-lg border p-3 text-left transition"
        :class="
          store.selectedItem?.id === item.id
            ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] shadow-[inset_3px_0_0_var(--color-primary)]'
            : 'border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]'
        "
        :aria-current="store.selectedItem?.id === item.id ? 'true' : undefined"
        @click="store.selectItem(item.id)"
      >
        <span class="flex items-start justify-between gap-3">
          <span class="min-w-0">
            <span class="flex min-w-0 items-center gap-2">
              <span class="text-xs font-medium text-[var(--color-text-muted)]">
                {{ String(index + 1).padStart(2, '0') }}
              </span>
              <span class="block truncate text-sm font-semibold">{{ item.title }}</span>
              <Star
                v-if="store.favorites.includes(item.id)"
                class="size-3.5 shrink-0 fill-[var(--color-accent)] text-[var(--color-accent)]"
                aria-label="已收藏"
              />
            </span>
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
        v-if="store.filteredItems.length > visibleCount"
        class="px-2 py-3 text-center text-xs text-[var(--color-text-muted)]"
      >
        已展示前 {{ visibleCount }} 首，请继续缩小筛选条件。
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ListFilter, Star } from 'lucide-vue-next'

import AppBadge from '@/components/ui/AppBadge.vue'
import { usePoetryStore } from '@/stores/poetry'

const store = usePoetryStore()
const visibleCount = computed(() => Math.min(store.filteredItems.length, 120))
</script>
