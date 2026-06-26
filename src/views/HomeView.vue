<template>
  <div class="flex h-screen flex-col overflow-hidden">
    <PoetryFiltersCompact />
    <SkeletonLoader v-if="store.loading" :progress="store.loadingProgress" class="flex-1" />
    <StateNotice v-else-if="store.error" title="索引加载失败" :description="store.error" tone="danger" />
    <template v-else>
      <StateNotice v-if="!store.filteredItems.length" title="没有匹配的作品" description="可以减少关键词，或切换到全部文集后重新检索。">
        <AppButton variant="secondary" @click="store.resetFilters">清空筛选</AppButton>
      </StateNotice>
      <div v-else class="relative flex flex-1 overflow-hidden">
        <aside class="absolute inset-y-0 left-0 z-30 flex flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg transition-all duration-300 ease-out"
          :class="showSidebar ? 'w-[340px] lg:w-[380px]' : 'w-0 border-r-0 shadow-none'">
          <div class="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-3 py-2.5">
            <span class="text-xs font-medium text-[var(--color-text-secondary)]">篇目（{{ store.filteredItems.length }}）</span>
            <AppButton variant="secondary" size="sm" @click="showSidebar = false"><X class="size-3.5" /></AppButton>
          </div>
          <PoetryList class="flex-1" />
        </aside>
        <div class="flex min-w-0 flex-1 flex-col">
          <header class="flex shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
            <button class="flex size-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
              :title="showSidebar ? '收起列表' : '展开列表'" @click="showSidebar = !showSidebar">
              <PanelLeftOpen v-if="!showSidebar" class="size-4" /><PanelLeftClose v-else class="size-4" />
            </button>
            <div class="min-w-0 flex-1">
              <h1 class="truncate text-sm font-semibold leading-tight">{{ store.selectedItem?.title }}</h1>
              <p class="truncate text-[11px] text-[var(--color-text-muted)]">{{ store.selectedItem?.dynasty }} · {{ store.selectedItem?.author }} · {{ store.selectedItem?.collection }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-1.5">
              <AppButton variant="secondary" size="sm" @click="copyPoem"><CopyCheck v-if="copied" class="size-3.5" /><Copy v-else class="size-3.5" /></AppButton>
              <AppButton :variant="isFavorite ? 'primary' : 'secondary'" size="sm" @click="store.toggleFavorite(store.selectedItem!.id)">
                <Star class="size-3.5" :class="isFavorite ? 'fill-white' : ''" />
              </AppButton>
              <AppButton variant="secondary" size="sm" @click="toggleCollectionList"><BookMarked class="size-3.5" /></AppButton>
            </div>
          </header>
          <PoetryReaderFullViewport class="flex-1" />
          <nav class="flex shrink-0 items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
            <button class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:pointer-events-none"
              :disabled="!prevItem" @click="navigateTo(prevItem!.id)">
              <ChevronLeft class="size-3.5" /><span class="hidden sm:inline truncate max-w-[120px]">{{ prevItem?.title || '无' }}</span>
            </button>
            <span class="text-[11px] text-[var(--color-text-muted)]">{{ currentIndex + 1 }} / {{ store.filteredItems.length }}</span>
            <button class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:pointer-events-none"
              :disabled="!nextItem" @click="navigateTo(nextItem!.id)">
              <span class="hidden sm:inline truncate max-w-[120px]">{{ nextItem?.title || '无' }}</span><ChevronRight class="size-3.5" />
            </button>
          </nav>
        </div>
        <div v-if="showCollections" class="absolute right-4 top-14 z-40 w-52 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-xl">
          <div class="max-h-64 overflow-y-auto space-y-0.5">
            <button v-for="col in store.collections" :key="col.id"
              class="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-[var(--color-surface-muted)]"
              :class="store.filters.collectionId === col.id ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-hover)]' : ''"
              @click="store.updateFilters({ collectionId: col.id }); showCollections = false">
              <span>{{ col.name }}</span><span class="tabular-nums text-[var(--color-text-muted)]">{{ col.count.toLocaleString() }}</span>
            </button>
          </div>
        </div>
        <button v-if="!showSidebar" class="fixed bottom-6 left-6 z-40 flex size-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg lg:hidden"
          aria-label="展开篇目列表" @click="showSidebar = true">
          <List class="size-5" />
        </button>
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BookMarked, ChevronLeft, ChevronRight, Copy, CopyCheck, List, PanelLeftClose, PanelLeftOpen, Star, X } from 'lucide-vue-next'
import type { PoetryItem } from '@/types/poetry'
import PoetryFiltersCompact from '@/components/PoetryFiltersCompact.vue'
import PoetryList from '@/components/PoetryList.vue'
import PoetryReaderFullViewport from '@/components/PoetryReaderFullViewport.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import StateNotice from '@/components/StateNotice.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { usePoetryStore } from '@/stores/poetry'
const store = usePoetryStore()
const showSidebar = ref(true)
const showCollections = ref(false)
const copied = ref(false)
onMounted(() => {
  store.loadCatalog()
  const mql = window.matchMedia('(max-width: 1023px)')
  showSidebar.value = !mql.matches
  mql.addEventListener('change', (e) => { if (!e.matches) showSidebar.value = true })
})
const currentIndex = computed(() => store.filteredItems.findIndex((item) => item.id === store.selectedId))
const prevItem = computed<PoetryItem | null>(() => { const idx = currentIndex.value; return idx > 0 ? store.filteredItems[idx - 1] : null })
const nextItem = computed<PoetryItem | null>(() => { const idx = currentIndex.value; return idx < store.filteredItems.length - 1 ? store.filteredItems[idx + 1] : null })
const isFavorite = computed(() => store.selectedItem ? store.favorites.includes(store.selectedItem.id) : false)
function navigateTo(id: string) { store.selectItem(id) }
function toggleCollectionList() { showCollections.value = !showCollections.value }
async function copyPoem() {
  const item = store.selectedItem; if (!item) return
  const text = item.title + '\n' + item.dynasty + ' \u00b7 ' + item.author + '\n\n' + item.paragraphs.join('\n')
  try { await navigator.clipboard.writeText(text); copied.value = true; window.setTimeout(() => { copied.value = false }, 1800) } catch { }
}
</script>
