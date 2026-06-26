<template>
  <section
    class="grid gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)] md:grid-cols-3"
    aria-label="诗词数据概览"
  >
    <div
      v-for="stat in stats"
      :key="stat.label"
      class="rounded-lg bg-[var(--color-surface-muted)] px-4 py-3"
    >
      <p class="text-sm text-[var(--color-text-muted)]">{{ stat.label }}</p>
      <p class="mt-2 text-2xl font-semibold">{{ stat.value }}</p>
      <p class="mt-1 text-xs text-[var(--color-text-muted)]">{{ stat.hint }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { usePoetryStore } from '@/stores/poetry'

const store = usePoetryStore()
const stats = computed(() => [
  {
    label: '索引作品',
    value: store.items.length.toLocaleString('zh-CN'),
    hint: '构建阶段从子模块生成',
  },
  {
    label: '文集类型',
    value: store.collections.length.toLocaleString('zh-CN'),
    hint: '唐诗、宋词、诗经等',
  },
  {
    label: '本地收藏',
    value: store.favoriteItems.length.toLocaleString('zh-CN'),
    hint: '仅保存在当前浏览器',
  },
])
</script>
