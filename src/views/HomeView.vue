<template>
  <div class="space-y-6">
    <section class="reading-hero rounded-lg border border-[var(--color-border)] p-4 sm:p-6 lg:p-7">
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <div class="min-w-0 space-y-5">
          <div class="max-w-3xl">
            <p class="flex items-center gap-2 text-sm font-medium text-[var(--color-accent)]">
              <BookOpenText class="size-4" aria-hidden="true" />
              诗屿阅读
            </p>
            <h1 class="mt-3 text-2xl font-semibold leading-tight text-[var(--color-text)] sm:text-3xl">
              先找一句，再读整篇。
            </h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
              按题名、作者、名句或标签检索，结果会立即进入右侧阅读区。
            </p>
          </div>

          <PoetryFilters />
        </div>

        <aside
          class="flex min-w-0 flex-col justify-between gap-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]"
          aria-label="当前阅读"
        >
          <div v-if="store.selectedItem" class="space-y-4">
            <div class="flex items-center justify-between gap-3">
              <span class="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary-hover)]">
                <Bookmark class="size-4" aria-hidden="true" />
                正在阅读
              </span>
              <span class="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-medium text-[var(--color-primary-hover)]">
                {{ store.selectedItem.collection }}
              </span>
            </div>

            <div>
              <h2 class="text-xl font-semibold leading-snug">{{ store.selectedItem.title }}</h2>
              <p class="mt-2 text-sm text-[var(--color-text-muted)]">
                {{ store.selectedItem.dynasty }} · {{ store.selectedItem.author }}
              </p>
            </div>

            <blockquote class="border-l-2 border-[var(--color-accent)] pl-4 text-sm leading-7 text-[var(--color-text-secondary)]">
              {{ store.selectedItem.excerpt }}
            </blockquote>
          </div>

          <div class="grid grid-cols-3 gap-2 border-t border-[var(--color-border)] pt-4 text-center">
            <div>
              <p class="text-lg font-semibold">{{ store.items.length.toLocaleString('zh-CN') }}</p>
              <p class="mt-1 text-xs text-[var(--color-text-muted)]">作品</p>
            </div>
            <div>
              <p class="text-lg font-semibold">{{ store.collections.length.toLocaleString('zh-CN') }}</p>
              <p class="mt-1 text-xs text-[var(--color-text-muted)]">文集</p>
            </div>
            <div>
              <p class="text-lg font-semibold">{{ store.favoriteItems.length.toLocaleString('zh-CN') }}</p>
              <p class="mt-1 text-xs text-[var(--color-text-muted)]">收藏</p>
            </div>
          </div>

          <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <AppButton class="w-full" @click="scrollToReader">
              <BookMarked class="size-4" aria-hidden="true" />
              阅读正文
            </AppButton>
            <AppButton
              variant="secondary"
              class="w-full"
              :disabled="!store.favoriteItems.length"
              @click="openFirstFavorite"
            >
              <Star class="size-4" aria-hidden="true" />
              继续收藏
            </AppButton>
          </div>
        </aside>
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

      <StateNotice
        v-if="!store.filteredItems.length"
        title="没有匹配的作品"
        description="可以减少关键词，或切换到全部文集后重新检索。"
      >
        <AppButton variant="secondary" @click="store.resetFilters">清空筛选</AppButton>
      </StateNotice>

      <section v-else class="grid min-w-0 gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <PoetryList />
        <PoetryReader />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { BookMarked, BookOpenText, Bookmark, Star } from 'lucide-vue-next'

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

function scrollToReader() {
  document.getElementById('reader')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function openFirstFavorite() {
  const firstFavorite = store.favoriteItems[0]
  if (!firstFavorite) return
  store.selectItem(firstFavorite.id)
  scrollToReader()
}
</script>
