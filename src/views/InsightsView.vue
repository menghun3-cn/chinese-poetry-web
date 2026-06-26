<template>
  <div class="space-y-5">
    <section class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
      <p class="text-sm font-medium text-[var(--color-accent)]">数据洞察</p>
      <h1 class="mt-3 text-3xl font-semibold">索引构成与热门作者</h1>
      <p class="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
        这里展示当前构建索引的数据规模，用于评估采样策略和后续扩展方向。
      </p>
    </section>

    <StateNotice
      v-if="store.loading"
      title="正在加载统计数据"
      description="图表会在诗词索引加载完成后渲染。"
      tone="loading"
    />
    <StateNotice v-else-if="store.error" title="统计加载失败" :description="store.error" tone="danger" />
    <template v-else>
      <PoetryStats />
      <CollectionChart />

      <section class="grid gap-5 lg:grid-cols-2">
        <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
          <h2 class="text-base font-semibold">热门作者</h2>
          <div class="mt-4 space-y-3">
            <div v-for="author in store.topAuthorsList" :key="author.name" class="flex items-center justify-between gap-4">
              <span class="truncate text-sm">{{ author.name }}</span>
              <span class="text-sm font-medium text-[var(--color-primary-hover)]">{{ author.count }} 首</span>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
          <h2 class="text-base font-semibold">收藏夹</h2>
          <div v-if="store.favoriteItems.length" class="mt-4 space-y-3">
            <div v-for="item in store.favoriteItems.slice(0, 8)" :key="item.id" class="rounded-lg bg-[var(--color-surface-muted)] p-3">
              <p class="truncate text-sm font-medium">{{ item.title }}</p>
              <p class="mt-1 text-xs text-[var(--color-text-muted)]">{{ item.author }} · {{ item.collection }}</p>
            </div>
          </div>
          <p v-else class="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
            还没有收藏。回到阅读页打开任意作品，点击“收藏”即可保存到当前浏览器。
          </p>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

import CollectionChart from '@/components/CollectionChart.vue'
import PoetryStats from '@/components/PoetryStats.vue'
import StateNotice from '@/components/StateNotice.vue'
import { usePoetryStore } from '@/stores/poetry'

const store = usePoetryStore()

onMounted(() => {
  void store.loadCatalog()
})
</script>
