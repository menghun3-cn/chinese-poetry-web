<template>
  <div class="min-w-0">
    <div class="mb-2 flex items-center justify-between">
      <p class="text-xs font-medium text-[var(--color-text-muted)]">常读作者</p>
      <button
        class="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary-hover)] transition hover:underline"
        @click="$emit('openAll')"
      >
        <LayoutGrid class="size-3.5" aria-hidden="true" />
        全部作者
      </button>
    </div>

    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      <button
        v-for="author in store.topAuthors"
        :key="author.name"
        class="group flex min-h-[52px] items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition"
        :class="
          store.filters.author === author.name
            ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] shadow-[inset_3px_0_0_var(--color-accent)]'
            : 'border-transparent bg-[var(--color-surface)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]'
        "
        :aria-pressed="store.filters.author === author.name"
        @click="toggleAuthor(author.name)"
      >
        <!-- 头像 -->
        <span
          class="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          :class="
            store.filters.author === author.name
              ? 'bg-[var(--color-accent)] text-white'
              : 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] group-hover:bg-[var(--color-border)]'
          "
        >
          {{ author.name.charAt(0) }}
        </span>

        <!-- 信息 -->
        <span class="min-w-0">
          <span class="block truncate text-sm font-medium">{{ author.name }}</span>
          <span class="block text-[11px] text-[var(--color-text-muted)]">
            {{ author.count }} 首
          </span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LayoutGrid } from 'lucide-vue-next'
import { usePoetryStore } from '@/stores/poetry'

defineEmits<{
  openAll: []
}>()

const store = usePoetryStore()

function toggleAuthor(author: string) {
  store.updateFilters({ author: store.filters.author === author ? '' : author })
}
</script>
