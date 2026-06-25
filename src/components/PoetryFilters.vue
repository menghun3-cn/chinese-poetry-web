<template>
  <section class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
    <div class="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end">
      <AppInput
        :model-value="store.filters.keyword"
        label="关键词"
        placeholder="搜索题名、作者、名句、标签"
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
        placeholder="如 李白、苏轼"
        :icon="UserRound"
        @update:model-value="store.updateFilters({ author: $event })"
      />

      <AppButton variant="secondary" class="w-full md:w-auto" @click="store.resetFilters">
        <RotateCcw class="size-4" aria-hidden="true" />
        重置
      </AppButton>
    </div>

    <div v-if="store.topTags.length" class="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="热门标签">
      <button
        v-for="tag in store.topTags"
        :key="tag.name"
        class="min-h-9 shrink-0 rounded-full border px-3 text-sm transition"
        :class="
          store.filters.tag === tag.name
            ? 'border-transparent bg-[var(--color-primary)] text-white'
            : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]'
        "
        @click="store.updateFilters({ tag: store.filters.tag === tag.name ? '' : tag.name })"
      >
        {{ tag.name }} {{ tag.count }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RotateCcw, Search, UserRound } from 'lucide-vue-next'

import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { usePoetryStore } from '@/stores/poetry'

const store = usePoetryStore()
</script>
