<template>
  <div class="flex shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2">
    <!-- 搜索框 -->
    <div class="relative min-w-0 flex-1 max-w-md">
      <Search class="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
      <input
        :value="store.filters.keyword"
        type="text"
        class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 pl-8 pr-3 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
        placeholder="搜索诗词标题、作者、名句…"
        @input="onSearch"
      />
    </div>
    <!-- 文集选择 -->
    <select
      :value="store.filters.collectionId"
      class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
      @change="store.updateFilters({ collectionId: ($event.target as HTMLSelectElement).value })"
    >
      <option value="all">全部文集</option>
      <option v-for="col in store.collections" :key="col.id" :value="col.id">{{ col.name }} ({{ col.count.toLocaleString() }})</option>
    </select>
    <!-- 作者输入 -->
    <div class="relative w-28">
      <UserRound class="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-[var(--color-text-muted)]" />
      <input
        :value="store.filters.author"
        type="text"
        class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 pl-7 pr-2 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
        placeholder="作者"
        @input="store.updateFilters({ author: ($event.target as HTMLInputElement).value })"
      />
    </div>
    <!-- 标签快捷选择 -->
    <button class="flex size-7 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
      title="标签筛选" @click="showTagPanel = !showTagPanel">
      <Tags class="size-3.5" />
      <span v-if="store.filters.tags.length" class="ml-0.5 text-[10px] font-bold text-[var(--color-primary)]">{{ store.filters.tags.length }}</span>
    </button>
    <!-- 重置 -->
    <button v-if="hasActiveFilters"
      class="flex size-7 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
      title="重置筛选" @click="store.resetFilters">
      <RotateCcw class="size-3.5" />
    </button>
    <!-- 标签面板层 -->
    <Teleport to="body">
      <div v-if="showTagPanel" class="fixed inset-0 z-50 flex items-start justify-center pt-16" @click.self="showTagPanel = false">
        <div class="w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-2xl">
          <div class="mb-3 flex items-center justify-between">
            <span class="text-xs font-semibold text-[var(--color-text-secondary)]">标签筛选</span>
            <button class="text-xs text-[var(--color-primary-hover)]" @click="showTagPanel = false">完成</button>
          </div>
          <div class="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto">
            <button v-for="tag in store.topTagsList" :key="tag"
              class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] transition"
              :class="store.filters.tags.includes(tag)
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-hover)] font-medium'
                : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]'"
              :aria-pressed="store.filters.tags.includes(tag)"
              @click="toggleTag(tag)">
              {{ tag }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { RotateCcw, Search, Tags, UserRound } from 'lucide-vue-next'
import { usePoetryStore } from '@/stores/poetry'

const store = usePoetryStore()
const showTagPanel = ref(false)
const hasActiveFilters = computed(() => Boolean(store.filters.keyword) || Boolean(store.filters.author) || store.filters.tags.length > 0 || store.filters.collectionId !== 'all')

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearch(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => store.updateFilters({ keyword: val }), 200)
}

function toggleTag(tag: string) {
  const current = store.filters.tags
  const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
  store.updateFilters({ tags: next })
  // 另外触发文集加载
  import('@/stores/tags').then(({ useTagsStore }) => useTagsStore().pushRecent(tag))
}
</script>
