<template>
  <section class="space-y-4" aria-labelledby="poetry-filter-title">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 id="poetry-filter-title" class="text-base font-semibold">快速检索</h2>
        <p class="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
          题名、作者、句段、词牌都可以直接搜索。
        </p>
      </div>
      <AppButton
        variant="secondary"
        class="w-full sm:w-auto"
        :disabled="!hasActiveFilters"
        @click="store.resetFilters"
      >
        <RotateCcw class="size-4" aria-hidden="true" />
        重置
      </AppButton>
    </div>

    <div class="grid gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)] md:grid-cols-[minmax(0,1.5fr)_minmax(160px,0.8fr)_minmax(140px,0.7fr)] md:items-end">
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

    <div class="space-y-5" v-if="showLabelClouds">
      <!-- 热门标签区域 -->
      <TagCloudPanel @open-all="showTagModal = true" />

      <!-- 常读作者区域 -->
      <AuthorCloudPanel @open-all="showAuthorModal = true" />
    </div>

    <!-- 弹出层 -->
    <TagSelectModal v-if="showTagModal" @close="showTagModal = false" />
    <AuthorSelectModal v-if="showAuthorModal" @close="showAuthorModal = false" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RotateCcw, Search, UserRound } from 'lucide-vue-next'

import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import TagCloudPanel from '@/components/TagCloudPanel.vue'
import TagSelectModal from '@/components/TagSelectModal.vue'
import AuthorCloudPanel from '@/components/AuthorCloudPanel.vue'
import AuthorSelectModal from '@/components/AuthorSelectModal.vue'
import { usePoetryStore } from '@/stores/poetry'

const store = usePoetryStore()

const showTagModal = ref(false)
const showAuthorModal = ref(false)

const hasActiveFilters = computed(
  () =>
    Boolean(store.filters.keyword) ||
    Boolean(store.filters.author) ||
    store.filters.tags.length > 0 ||
    store.filters.collectionId !== 'all',
)

// 数据加载完成后才展示标签/作者云
const showLabelClouds = computed(() => !store.loading && !store.error)
</script>
