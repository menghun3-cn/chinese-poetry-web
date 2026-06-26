<template>
  <section
    class="min-w-0 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
    aria-label="诗词列表"
  >
    <header class="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-3 py-2.5">
      <p class="text-xs font-medium text-[var(--color-text-muted)]">
        检索结果 · <span class="font-semibold">{{ store.filteredItems.length }}</span>
      </p>
      <span class="rounded-full bg-[var(--color-surface-muted)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
        点击切换
      </span>
    </header>

    <div
      ref="listRef"
      class="overflow-y-auto"
      :style="{ height: listHeight + 'px' }"
      @scroll="onScroll"
    >
      <div :style="{ height: totalHeight + 'px', position: 'relative' }">
        <button
          v-for="item in visibleItems"
          :key="item.id"
          class="absolute left-0 right-0 min-h-[72px] rounded-lg border p-2.5 text-left text-sm transition"
          :style="{
            top: item._top + 'px',
            borderColor: store.selectedItem?.id === item.id ? 'var(--color-primary)' : 'transparent',
            backgroundColor: store.selectedItem?.id === item.id ? 'var(--color-primary-soft)' : '',
            boxShadow: store.selectedItem?.id === item.id ? 'inset 3px 0 0 var(--color-primary)' : '',
          }"
          :aria-current="store.selectedItem?.id === item.id ? 'true' : undefined"
          @click="store.selectItem(item.id)"
        >
          <span class="flex items-start justify-between gap-2">
            <span class="min-w-0">
              <span class="flex items-center gap-1.5">
                <span class="text-[11px] font-medium text-[var(--color-text-muted)]">
                  {{ item._index }}
                </span>
                <span class="block truncate text-sm font-medium">{{ item.title }}</span>
                <Star
                  v-if="store.favorites.includes(item.id)"
                  class="size-3 shrink-0 fill-[var(--color-accent)] text-[var(--color-accent)]"
                  aria-label="已收藏"
                />
              </span>
              <span class="mt-0.5 block truncate text-[11px] text-[var(--color-text-muted)]">
                {{ item.dynasty }} · {{ item.author }}
              </span>
            </span>
            <AppBadge v-if="item.tags[0]" tone="accent" class="shrink-0 text-[10px]">{{ item.tags[0] }}</AppBadge>
          </span>
          <span class="mt-1 line-clamp-1 block text-xs leading-5 text-[var(--color-text-secondary)]">
            {{ item.excerpt }}
          </span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Star } from 'lucide-vue-next'

import AppBadge from '@/components/ui/AppBadge.vue'
import { usePoetryStore } from '@/stores/poetry'

const store = usePoetryStore()
const listRef = ref<HTMLElement | null>(null)

// 虚拟滚动配置
const ITEM_HEIGHT = 72
const ITEM_GAP = 8
const OVERSCAN = 5
const CONTAINER_PADDING = 8

const scrollTop = ref(0)
const listHeight = ref(typeof window !== 'undefined' ? Math.min(640, window.innerHeight - 200) : 640)

const items = computed(() =>
  store.filteredItems.map((item, i) => ({
    ...item,
    _index: String(i + 1).padStart(3, '0'),
    _top: i * (ITEM_HEIGHT + ITEM_GAP) + CONTAINER_PADDING,
  })),
)

const totalHeight = computed(() => items.value.length * (ITEM_HEIGHT + ITEM_GAP) + CONTAINER_PADDING * 2)

const visibleItems = computed(() => {
  const start = Math.max(0, Math.floor(scrollTop.value / (ITEM_HEIGHT + ITEM_GAP)) - OVERSCAN)
  const visibleCount = Math.ceil(listHeight.value / (ITEM_HEIGHT + ITEM_GAP)) + OVERSCAN * 2
  return items.value.slice(start, start + visibleCount)
})

function onScroll() {
  if (listRef.value) {
    scrollTop.value = listRef.value.scrollTop
  }
}

onMounted(() => {
  if (listRef.value) {
    listHeight.value = Math.min(640, window.innerHeight - 200)
  }
})

watch(() => store.filteredItems.length, () => {
  scrollTop.value = 0
  if (listRef.value) listRef.value.scrollTop = 0
})
</script>
