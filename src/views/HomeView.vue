<template>
  <div class="space-y-5">
    <section class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
      <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
        <p class="text-sm font-medium text-[var(--color-accent)]">基于 chinese-poetry 子模块</p>
        <h1 class="mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
          从诗经到宋词，把经典文本变成可检索、可收藏、可阅读的静态站点。
        </h1>
        <p class="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
          支持按文集、作者、标签和句段搜索；构建时从 Git 子模块生成精简索引，适合部署到 Cloudflare Pages。
        </p>
      </div>

      <div class="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-5 text-white shadow-[var(--shadow-card)]">
        <div class="flex items-center gap-3">
          <Database class="size-5" aria-hidden="true" />
          <span class="text-sm font-medium">数据状态</span>
        </div>
        <p class="text-3xl font-semibold">{{ store.items.length.toLocaleString('zh-CN') }}</p>
        <p class="text-sm leading-6 text-white/75">
          当前索引作品数。原始数据保留在子模块中，构建脚本可按需扩大采样范围。
        </p>
      </div>
    </section>

    <StateNotice
      v-if="store.loading"
      title="正在加载诗词索引"
      description="首次打开会读取构建生成的静态 JSON。"
      tone="loading"
    />
    <StateNotice
      v-else-if="store.error"
      title="索引加载失败"
      :description="store.error"
      tone="danger"
    />
    <template v-else>
      <PoetryStats />
      <PoetryFilters />

      <StateNotice
        v-if="!store.filteredItems.length"
        title="没有匹配的作品"
        description="可以减少关键词，或切换到全部文集后重新检索。"
      >
        <AppButton variant="secondary" @click="store.resetFilters">清空筛选</AppButton>
      </StateNotice>

      <section v-else class="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <PoetryList />
        <PoetryReader />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Database } from 'lucide-vue-next'

import PoetryFilters from '@/components/PoetryFilters.vue'
import PoetryList from '@/components/PoetryList.vue'
import PoetryReader from '@/components/PoetryReader.vue'
import PoetryStats from '@/components/PoetryStats.vue'
import StateNotice from '@/components/StateNotice.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { usePoetryStore } from '@/stores/poetry'

const store = usePoetryStore()

onMounted(() => {
  void store.loadCatalog()
})
</script>
