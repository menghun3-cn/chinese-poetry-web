<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="全部标签"
      @click.self="$emit('close')"
    >
      <div
        class="relative mx-4 w-full max-w-3xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-popover)]"
      >
        <!-- 头部 -->
        <header class="flex items-center justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">
          <div class="min-w-0">
            <h2 class="text-lg font-semibold">全部标签</h2>
            <p class="mt-0.5 text-sm text-[var(--color-text-muted)]">
              共 {{ tagsCount }} 个标签，点击可多选
            </p>
          </div>
          <button
            class="flex size-9 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
            aria-label="关闭"
            @click="$emit('close')"
          >
            <X class="size-5" />
          </button>
        </header>

        <!-- 搜索 -->
        <div class="border-b border-[var(--color-border)] px-5 py-3">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" aria-hidden="true" />
            <input
              v-model="searchQuery"
              type="text"
              class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] py-2 pl-9 pr-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition focus:border-[var(--color-primary)] focus:outline-none"
              placeholder="搜索标签…"
            />
          </div>
        </div>

        <!-- 分类标签页 -->
        <div class="flex gap-1 overflow-x-auto border-b border-[var(--color-border)] px-5 py-2">
          <button
            v-for="cat in tagsStore.nonEmptyCategories"
            :key="cat.id"
            class="shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition"
            :class="
              activeCategory === cat.id
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]'
            "
            @click="activeCategory = cat.id"
          >
            {{ cat.label }}
            <span class="ml-1 text-[11px] opacity-70">
              {{ (tagsStore.tagsByCategory.get(cat.id) ?? []).length }}
            </span>
          </button>
        </div>

        <!-- 标签内容 -->
        <div class="max-h-[420px] overflow-y-auto px-5 py-4">
          <div v-if="searchQuery" class="space-y-2">
            <p class="text-xs font-medium text-[var(--color-text-muted)]">
              搜索结果（{{ searchResults.length }}）
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tag in searchResults"
                :key="tag.name"
                class="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition"
                :class="
                  isSelected(tag.name)
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-hover)] font-medium'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]'
                "
                :aria-pressed="isSelected(tag.name)"
                @click="toggleTag(tag.name)"
              >
                {{ tag.name }}
                <span class="text-[11px] text-[var(--color-text-muted)]">{{ tag.count }}</span>
                <Check v-if="isSelected(tag.name)" class="ml-0.5 size-3.5" />
              </button>
            </div>
            <p v-if="!searchResults.length" class="py-6 text-center text-sm text-[var(--color-text-muted)]">
              没有匹配的标签
            </p>
          </div>

          <div v-else class="space-y-5">
            <section
              v-for="cat in tagsStore.nonEmptyCategories"
              v-show="activeCategory === cat.id"
              :key="cat.id"
            >
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="tag in tagsStore.tagsByCategory.get(cat.id) ?? []"
                  :key="tag.name"
                  class="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition"
                  :class="
                    isSelected(tag.name)
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-hover)] font-medium'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]'
                  "
                  :aria-pressed="isSelected(tag.name)"
                  @click="toggleTag(tag.name)"
                >
                  {{ tag.name }}
                  <span class="text-[11px] text-[var(--color-text-muted)]">{{ tag.count }}</span>
                  <Check v-if="isSelected(tag.name)" class="ml-0.5 size-3.5" />
                </button>
              </div>
            </section>
          </div>
        </div>

        <!-- 底部 -->
        <footer class="flex items-center justify-between gap-3 border-t border-[var(--color-border)] px-5 py-3">
          <span class="text-sm text-[var(--color-text-muted)]">
            已选 {{ store.filters.tags.length }} 个标签
          </span>
          <button
            class="text-sm font-medium text-[var(--color-primary-hover)] transition hover:underline"
            @click="clearTags"
          >
            清除全部
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Search, X } from 'lucide-vue-next'

import { usePoetryStore } from '@/stores/poetry'
import { useTagsStore } from '@/stores/tags'
import type { TagCategory } from '@/types/tags'

defineEmits<{
  close: []
}>()

const store = usePoetryStore()
const tagsStore = useTagsStore()

const searchQuery = ref('')
const activeCategory = ref<TagCategory>('subject')

const tagsCount = computed(() => tagsStore.globalTagCounts.size)

const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLocaleLowerCase('zh-CN')
  if (!q) return []
  return [...tagsStore.globalTagCounts.entries()]
    .filter(([name]) => name.toLocaleLowerCase('zh-CN').includes(q))
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, category: tagsStore.getCategory(name) }))
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

function clearTags() {
  store.updateFilters({ tags: [] })
}
</script>
