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

    <div class="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <div v-if="store.topTags.length" class="min-w-0" aria-label="热门标签">
        <p class="mb-2 text-xs font-medium text-[var(--color-text-muted)]">热门标签</p>
        <div class="flex gap-2 overflow-x-auto pb-1">
          <button
            v-for="tag in store.topTags"
            :key="tag.name"
            class="min-h-11 shrink-0 rounded-full border px-3 text-sm transition"
            :class="
              store.filters.tag === tag.name
                ? 'border-transparent bg-[var(--color-primary)] text-white'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]'
            "
            :aria-pressed="store.filters.tag === tag.name"
            @click="store.updateFilters({ tag: store.filters.tag === tag.name ? '' : tag.name })"
          >
            {{ tag.name }} {{ tag.count }}
          </button>
        </div>
      </div>

      <div v-if="store.topAuthors.length" class="min-w-0" aria-label="常读作者">
        <p class="mb-2 text-xs font-medium text-[var(--color-text-muted)]">常读作者</p>
        <div class="flex gap-2 overflow-x-auto pb-1">
          <button
            v-for="author in store.topAuthors.slice(0, 8)"
            :key="author.name"
            class="min-h-11 shrink-0 rounded-full border px-3 text-sm transition"
            :class="
              store.filters.author === author.name
                ? 'border-transparent bg-[var(--color-accent)] text-white'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]'
            "
            :aria-pressed="store.filters.author === author.name"
            @click="selectAuthor(author.name)"
          >
            {{ author.name }} {{ author.count }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RotateCcw, Search, UserRound } from 'lucide-vue-next'

import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { usePoetryStore } from '@/stores/poetry'

const store = usePoetryStore()

const hasActiveFilters = computed(
  () =>
    Boolean(store.filters.keyword) ||
    Boolean(store.filters.author) ||
    Boolean(store.filters.tag) ||
    store.filters.collectionId !== 'all',
)

function selectAuthor(author: string) {
  store.updateFilters({ author: store.filters.author === author ? '' : author })
}
</script>
