<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h3 class="text-xs font-semibold text-[var(--color-text-secondary)]">
          作者筛选
        </h3>
        <span
          v-if="store.filters.author"
          class="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-accent)]"
        >
          {{ store.filters.author }}
        </span>
      </div>
      <button
        v-if="store.filters.author"
        class="text-[11px] font-medium text-[var(--color-primary-hover)] transition hover:underline"
        @click="clearAuthor"
      >
        清除
      </button>
    </div>

    <!-- 搜索 -->
    <div class="relative">
      <Search class="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" aria-hidden="true" />
      <input
        v-model="searchQuery"
        type="text"
        class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] py-1.5 pl-8 pr-3 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition focus:border-[var(--color-primary)] focus:outline-none"
        placeholder="搜索作者…"
      />
    </div>

    <!-- 作者列表 -->
    <div class="max-h-[320px] overflow-y-auto rounded-lg border border-[var(--color-border)]">
      <div v-if="displayAuthors.length" class="divide-y divide-[var(--color-border)]">
        <button
          v-for="author in displayAuthors"
          :key="author.name"
          class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-[var(--color-surface-muted)]"
          :class="
            store.filters.author === author.name
              ? 'bg-[var(--color-accent-soft)]'
              : ''
          "
          :aria-pressed="store.filters.author === author.name"
          @click="selectAuthor(author.name)"
        >
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
            :class="
              store.filters.author === author.name
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
            "
          >
            {{ author.name.charAt(0) }}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-xs font-medium">{{ author.name }}</span>
          </span>
          <span class="shrink-0 text-[11px] tabular-nums text-[var(--color-text-muted)]">
            {{ author.count }}
          </span>
        </button>
      </div>
      <p v-else class="py-8 text-center text-xs text-[var(--color-text-muted)]">
        没有匹配的作者
      </p>
    </div>

    <button
      v-if="allAuthors.length > defaultLimit && !showAll && !searchQuery"
      class="w-full rounded-lg border border-dashed border-[var(--color-border)] py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
      @click="showAll = true"
    >
      展开全部（{{ allAuthors.length }} 位）
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search } from 'lucide-vue-next'

import { usePoetryStore } from '@/stores/poetry'

const store = usePoetryStore()

const searchQuery = ref('')
const showAll = ref(false)
const defaultLimit = 20

const allAuthors = computed(() => {
  const counter = new Map<string, number>()
  for (const item of store.items) {
    if (item.author && item.author !== '佚名')
      counter.set(item.author, (counter.get(item.author) || 0) + 1)
  }
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))
})

const displayAuthors = computed(() => {
  const q = searchQuery.value.trim().toLocaleLowerCase('zh-CN')
  let filtered = allAuthors.value
  if (q) {
    filtered = filtered.filter((a) => a.name.toLocaleLowerCase('zh-CN').includes(q))
  } else if (!showAll.value) {
    filtered = filtered.slice(0, defaultLimit)
  }
  return filtered
})

function selectAuthor(author: string) {
  store.updateFilters({ author: store.filters.author === author ? '' : author })
}

function clearAuthor() {
  store.updateFilters({ author: '' })
}
</script>
