<template>
  <div class="flex flex-col gap-5">
    <!-- ====== 搜索栏（始终固定在顶部） ====== -->
    <PoetryFilters />

    <!-- ====== 加载态：骨架屏 ====== -->
    <SkeletonLoader v-if="store.loading" />

    <!-- ====== 错误态 ====== -->
    <StateNotice
      v-else-if="store.error"
      title="索引加载失败"
      :description="store.error"
      tone="danger"
    />

    <!-- ====== 主内容区：阅读区为主，列表为侧栏 ====== -->
    <template v-else>
      <!-- 空结果 -->
      <StateNotice
        v-if="!store.filteredItems.length"
        title="没有匹配的作品"
        description="可以减少关键词，或切换到全部文集后重新检索。"
      >
        <AppButton variant="secondary" @click="store.resetFilters">清空筛选</AppButton>
      </StateNotice>

      <!-- 正常内容 -->
      <section v-else class="flex min-h-[calc(100vh-12rem)] flex-col gap-0 lg:flex-row lg:gap-5">
        <!-- ====== 列表侧栏（桌面可折叠 / 移动端抽屉） ====== -->
        <aside
          class="poetry-list-panel flex-shrink-0"
          :class="showSidebar ? 'poetry-list-panel--open' : 'poetry-list-panel--closed'"
        >
          <div class="mb-3 flex items-center justify-between lg:hidden">
            <h2 class="text-sm font-semibold text-[var(--color-text-secondary)]">
              篇目（{{ store.filteredItems.length }}）
            </h2>
            <AppButton variant="secondary" size="sm" @click="showSidebar = false">
              <X class="size-4" aria-hidden="true" />
            </AppButton>
          </div>
          <PoetryList />
        </aside>

        <!-- ====== 阅读区（主体） ====== -->
        <div class="flex min-w-0 flex-1 flex-col">
          <!-- 折叠切换按钮（桌面） -->
          <button
            class="mb-3 hidden items-center gap-2 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] lg:flex"
            @click="showSidebar = !showSidebar"
          >
            <PanelLeftClose v-if="showSidebar" class="size-4" aria-hidden="true" />
            <PanelLeftOpen v-else class="size-4" aria-hidden="true" />
            {{ showSidebar ? '收起列表' : '展开列表' }}
          </button>

          <!-- 阅读区 -->
          <PoetryReader />
        </div>

        <!-- ====== 移动端浮动按钮 ====== -->
        <button
          class="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg lg:hidden"
          aria-label="展开篇目列表"
          @click="showSidebar = true"
        >
          <List class="size-6" aria-hidden="true" />
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
  // 桌面端初次访问默认收起列表，阅读区最大
  const mql = window.matchMedia('(max-width: 1023px)')
  showSidebar.value = !mql.matches
  mql.addEventListener('change', (e) => {
    if (!e.matches) showSidebar.value = true
  })
})
</script>

<style scoped>
.poetry-list-panel {
  @apply overflow-hidden transition-all duration-300;
  width: 0;
  opacity: 0;
}
.poetry-list-panel--open {
  width: 420px;
  opacity: 1;
}
@media (max-width: 1023px) {
  .poetry-list-panel {
    position: fixed;
    inset: 0;
    z-index: 50;
    width: 100% !important;
    opacity: 1;
    background: var(--color-surface);
    transform: translateX(100%);
    padding: 1rem;
    overflow-y: auto;
    transition: transform 0.25s ease;
  }
  .poetry-list-panel--open {
    transform: translateX(0);
  }
  .poetry-list-panel--closed {
    transform: translateX(100%);
  }
}
</style>
