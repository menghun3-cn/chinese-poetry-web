<template>
  <section class="space-y-4" aria-labelledby="poetry-filter-title">
    <!-- 顶部：标题 + 搜索栏 -->
    <div class="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)]">
      <div class="flex items-center justify-between">
        <h2 id="poetry-filter-title" class="text-sm font-semibold">快速检索</h2>
        <AppButton
          variant="secondary"
          size="sm"
          :disabled="!hasActiveFilters"
          @click="store.resetFilters"
        >
          <RotateCcw class="size-3.5" aria-hidden="true" />
          重置
        </AppButton>
      </div>

      <div class="grid gap-2 md:grid-cols-[minmax(0,1.5fr)_minmax(140px,0.6fr)_minmax(120px,0.5fr)]">
        <AppInput
          :model-value="store.filters.keyword"
          label="关键词"
          placeholder="如 春江花月夜、苏轼、明月"
          :icon="Search"
          @update:model-value="store.updateFilters({ keyword: $event })"
        />

        <AppSelect
          :model-value="store.filters.collectionId"
          label="文集"
          @update:model-value="store.updateFilters({ collectionId: $event })"
        >
          <option value="all">全部文集</option>
          <option v-for="collection in store.collections" :key="collection.id" :value="collection.id">
            {{ collection.name }}（{{ collection.count }}）
          </option>
        </AppSelect>

        <AppInput
          :model-value="store.filters.author"
          label="作者"
          placeholder="李白、苏轼"
          :icon="UserRound"
          @update:model-value="store.updateFilters({ author: $event })"
        />
      </div>
    </div>

    <!-- 标签/作者选项卡区域 -->
    <div v-if="showLabelClouds" class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)]">
      <div class="flex gap-1 border-b border-[var(--color-border)] pb-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="rounded-md px-3 py-1 text-xs font-medium transition"
          :class="
            activeTab === tab.id
              ? 'bg-[var(--color-primary)] text-white'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]'
          "
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
          <span class="ml-1 text-[10px] opacity-70">{{ tab.count }}</span>
        </button>
      </div>

      <div class="pt-3">
        <TagCloudPanel v-if="activeTab === 'tags'" />
        <AuthorCloudPanel v-if="activeTab === 'authors'" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RotateCcw, Search, UserRound } from 'lucide-vue-next'

import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import TagCloudPanel from '@/components/TagCloudPanel.vue'
import AuthorCloudPanel from '@/components/AuthorCloudPanel.vue'
import { usePoetryStore } from '@/stores/poetry'

const store = usePoetryStore()

const activeTab = ref<'tags' | 'authors'>('tags')

interface FilterTab {
  id: 'tags' | 'authors'
  label: string
  count: number
}

const tabs = computed<FilterTab[]>(() => [
  { id: 'tags', label: '标签', count: store.filters.tags.length },
  { id: 'authors', label: '作者（常读）', count: store.filters.author ? 1 : 0 },
])

const hasActiveFilters = computed(
  () =>
    Boolean(store.filters.keyword) ||
    Boolean(store.filters.author) ||
    store.filters.tags.length > 0 ||
    store.filters.collectionId !== 'all',
)

const showLabelClouds = computed(() => !store.loading && !store.error)
</script>



