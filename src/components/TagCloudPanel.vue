<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h3 class="text-xs font-semibold text-[var(--color-text-secondary)]">
          标签筛选
        </h3>
        <span
          v-if="store.filters.tags.length"
          class="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-primary-hover)]"
        >
          {{ store.filters.tags.length }} 个选中
        </span>
      </div>
      <div class="flex items-center gap-1.5">
        <button
          v-if="store.filters.tags.length"
          class="text-[11px] font-medium text-[var(--color-primary-hover)] transition hover:underline"
          @click="clearAllTags"
        >
          清除
        </button>
        <button
          class="flex size-6 items-center justify-center rounded text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
          :aria-label="expandAll ? '收起全部' : '展开全部'"
          @click="expandAll = !expandAll"
        >
          <ChevronsUpDown class="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- 搜索 -->
    <div class="relative">
      <Search class="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" aria-hidden="true" />
      <input
        v-model="searchQuery"
        type="text"
        class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] py-1.5 pl-8 pr-3 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition focus:border-[var(--color-primary)] focus:outline-none"
        placeholder="搜索标签…"
      />
    </div>

    <!-- 已选标签提示条 -->
    <div
      v-if="store.filters.tags.length"
      class="flex flex-wrap gap-1 rounded-md border border-dashed border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-2 py-1.5"
    >
      <span
        v-for="tag in store.filters.tags"
        :key="'selected-' + tag"
        class="inline-flex items-center gap-1 rounded-md bg-[var(--color-primary)] px-2 py-0.5 text-[11px] font-medium text-white"
      >
        {{ tag }}
        <X class="size-3 cursor-pointer" @click="toggleTag(tag)" />
      </span>
    </div>

    <!-- 搜索模式 -->
    <div v-if="searchQuery" class="max-h-60 overflow-y-auto">
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="tag in searchResults"
          :key="tag.name"
          class="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition"
          :class="
            isSelected(tag.name)
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-hover)] font-medium'
              : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]'
          "
          :aria-pressed="isSelected(tag.name)"
          @click="toggleTag(tag.name)"
        >
          {{ tag.name }}
          <span class="text-[10px] text-[var(--color-text-muted)]">{{ tag.count }}</span>
        </button>
      </div>
      <p v-if="!searchResults.length" class="py-4 text-center text-xs text-[var(--color-text-muted)]">
        没有匹配的标签
      </p>
    </div>

    <!-- 分类分组模式 -->
    <div v-else class="space-y-3">
      <div
        v-for="cat in tagsStore.nonEmptyCategories"
        :key="cat.id"
        class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2"
      >
        <button
          class="flex w-full items-center justify-between gap-2"
          @click="toggleCategory(cat.id)"
        >
          <span class="flex items-center gap-1.5">
            <ChevronRight
              class="size-3 text-[var(--color-text-muted)] transition-transform duration-200"
              :class="expandedCategories.has(cat.id) ? 'rotate-90' : ''"
            />
            <span class="text-[11px] font-semibold text-[var(--color-text-secondary)]">{{ cat.label }}</span>
            <span class="text-[10px] text-[var(--color-text-muted)]">
              {{ (tagsStore.tagsByCategory.get(cat.id) || []).length }}
            </span>
          </span>
        </button>

        <div
          v-if="expandedCategories.has(cat.id)"
          class="mt-1.5 flex flex-wrap gap-1"
        >
          <button
            v-for="tag in getCategoryTags(cat.id)"
            :key="tag.name"
            class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] transition"
            :class="
              isSelected(tag.name)
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-hover)] font-medium'
                : 'border-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]'
            "
            :aria-pressed="isSelected(tag.name)"
            @click="toggleTag(tag.name)"
          >
            {{ tag.name }}
            <span class="text-[10px] text-[var(--color-text-muted)]">{{ tag.count }}</span>
          </button>
        </div>
      </div>

      <p v-if="tagsStore.nonEmptyCategories.length === 0" class="py-4 text-center text-xs text-[var(--color-text-muted)]">
        标签数据加载中…
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronRight, ChevronsUpDown, Search, X } from 'lucide-vue-next'

import type { TagCategory } from '@/types/tags'
import { usePoetryStore } from '@/stores/poetry'
import { useTagsStore } from '@/stores/tags'

const store = usePoetryStore()
const tagsStore = useTagsStore()

const searchQuery = ref('')
const expandAll = ref(false)
const expandedCategories = ref<Set<string>>(new Set(['subject', 'emotion', 'season']))

function toggleCategory(id: string) {
  const next = new Set(expandedCategories.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  expandedCategories.value = next
}

watch(expandAll, (val) => {
  if (val) {
    expandedCategories.value = new Set(tagsStore.nonEmptyCategories.map((c) => c.id))
  } else {
    expandedCategories.value = new Set(['subject', 'emotion', 'season'])
  }
})

function getCategoryTags(catId: string) {
  return tagsStore.tagsByCategory.get(catId as TagCategory) || []
}

const searchResults = computed((): { name: string; count: number; category: string }[] => {
  const q = searchQuery.value.trim().toLocaleLowerCase('zh-CN')
  if (!q) return []
  const result: { name: string; count: number; category: string }[] = []
  for (const [name, count] of Object.entries(tagsStore.globalTagCounts)) {
    if (name.toLocaleLowerCase('zh-CN').includes(q)) {
      result.push({ name, count, category: tagsStore.getCategory(name) })
    }
  }
  result.sort((a, b) => b.count - a.count)
  return result
})

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

function clearAllTags() {
  store.updateFilters({ tags: [] })
}
</script>




