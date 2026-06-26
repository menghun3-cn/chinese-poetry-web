<template>
  <div class="flex flex-col gap-4">
    <!-- 搜索栏 -->
    <PoetryFilters />

    <!-- 加载态：骨架屏 -->
    <SkeletonLoader v-if="store.loading" :progress="store.loadingProgress" />

    <!-- 错误态 -->
    <StateNotice
      v-else-if="store.error"
      title="索引加载失败"
      :description="store.error"
      tone="danger"
    />

    <!-- 主内容区 -->
    <template v-else>
      <!-- 空结果 -->
      <StateNotice
        v-if="!store.filteredItems.length"
        title="没有匹配的作品"
        description="可以减少关键词，或切换到全部文集后重新检索。"
      >
        <AppButton variant="secondary" @click="store.resetFilters">清空筛选</AppButton>
      </StateNotice>

      <!-- 正常布局：左侧列表 / 右侧阅读器 -->
      <section v-else class="flex flex-1 flex-col gap-4 lg:flex-row" style="min-height: calc(100vh - 220px)">
        <!-- 列表侧栏 -->
        <aside
          class="flex-shrink-0 overflow-hidden transition-all duration-300"
          :class="showSidebar ? 'w-full lg:w-[380px]' : 'w-0 opacity-0 lg:w-0'"
        >
          <div class="flex h-full flex-col">
            <div class="mb-2 flex items-center justify-between lg:hidden">
              <h2 class="text-sm font-semibold text-[var(--color-text-secondary)]">
                篇目（{{ store.filteredItems.length }}）
              </h2>
              <AppButton variant="secondary" size="sm" @click="showSidebar = false">
                <X class="size-4" aria-hidden="true" />
              </AppButton>
            </div>
            <PoetryList />
          </div>
        </aside>

        <!-- 阅读区（主体） -->
        <div class="flex min-w-0 flex-1 flex-col">
          <!-- 折叠切换按钮（桌面） -->
          <button
            class="mb-2 hidden items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] lg:flex"
            @click="showSidebar = !showSidebar"
          >
            <PanelLeftClose v-if="showSidebar" class="size-3.5" aria-hidden="true" />
            <PanelLeftOpen v-else class="size-3.5" aria-hidden="true" />
            {{ showSidebar ? '收起列表' : '展开列表' }}
          </button>

          <PoetryReader class="flex-1" />
        </div>

        <!-- 移动端浮动按钮 -->
        <button
          class="fixed bottom-6 right-6 z-40 flex size-12 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg lg:hidden"
          aria-label="展开篇目列表"
          @click="showSidebar = true"
        >
          <List class="size-5" aria-hidden="true" />
        </button>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { List, PanelLeftClose, PanelLeftOpen, X } from 'lucide-vue-next'

import PoetryFilters from '@/components/PoetryFilters.vue'
import PoetryList from '@/components/PoetryList.vue'
import PoetryReader from '@/components/PoetryReader.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import StateNotice from '@/components/StateNotice.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { usePoetryStore } from '@/stores/poetry'

const store = usePoetryStore()
const showSidebar = ref(true)

onMounted(() => {
  void store.loadCatalog()
  const mql = window.matchMedia('(max-width: 1023px)')
  showSidebar.value = !mql.matches
  mql.addEventListener('change', (e) => {
    if (!e.matches) showSidebar.value = true
  })
})
</script>
