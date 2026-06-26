<template>
  <div class="min-w-0">
    <div class="mb-2 flex items-center justify-between">
      <p class="text-xs font-medium text-[var(--color-text-muted)]">热门标签</p>
      <button
        class="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary-hover)] transition hover:underline"
        @click="$emit('openAll')"
      >
        <LayoutGrid class="size-3.5" aria-hidden="true" />
        全部标签
      </button>
    </div>

    <!-- 最近使用 -->
    <div
      v-if="tagsStore.recentTags.length"
      class="mb-2 rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5"
    >
      <p class="mb-1 text-[11px] font-medium text-[var(--color-text-muted)]">最近使用</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="tag in tagsStore.recentTags"
          :key="`recent-${tag}`"
          class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition"
          :class="
            isSelected(tag)
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
          "
          :aria-pressed="isSelected(tag)"
          @click="toggleTag(tag)"
        >
          <Clock class="size-3" aria-hidden="true" />
          {{ tag }}
        </button>
      </div>
    </div>

    <!-- 标签网格 -->
    <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
      <button
        v-for="tag in store.topTags"
        :key="tag.name"
        class="group flex min-h-10 items-center justify-between gap-1 rounded-lg border px-2.5 py-1.5 text-sm transition"
        :class="
          isSelected(tag.name)
            ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-hover)] font-medium shadow-[inset_2px_0_0_var(--color-primary)]'
            : 'border-transparent bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]'
        "
        :aria-pressed="isSelected(tag.name)"
        @click="toggleTag(tag.name)"
      >
        <span class="truncate">{{ tag.name }}</span>
        <span
          class="shrink-0 text-[11px] tabular-nums"
          :class="isSelected(tag.name) ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'"
        >
          {{ tag.count }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Clock, LayoutGrid } from 'lucide-vue-next'
import { usePoetryStore } from '@/stores/poetry'
import { useTagsStore } from '@/stores/tags'

defineEmits<{
  openAll: []
}>()

const store = usePoetryStore()
const tagsStore = useTagsStore()

function isSelected(tag: string): boolean {
  return store.filters.tags.includes(tag)
}

function toggleTag(tag: string) {
  const current = store.filters.tags
  const next = current.includes(tag)
    ? current.filter((t) => t !== tag)
    : [...current, tag]
  store.updateFilters({ tags: next })
  tagsStore.pushRecent(tag)
}
</script>
