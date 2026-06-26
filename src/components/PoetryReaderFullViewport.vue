<template>
  <div v-if="item" class="flex flex-1 flex-col overflow-hidden">
    <div class="flex flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-8 sm:py-6">
      <div class="mx-auto w-full max-w-2xl">
        <!-- 诗词正文 -->
        <div class="reader-paper space-y-3 rounded-xl border border-white/70 bg-white/60 p-4 sm:p-8">
          <p v-for="(line, index) in item.paragraphs" :key="item.id + '-' + index"
            class="poem-line leading-relaxed text-[var(--color-text)]"
            :class="index === 0 ? 'text-[17px] sm:text-lg' : 'text-[15px] sm:text-[16px]'">
            {{ line }}
          </p>
        </div>
        <!-- 标签 -->
        <div class="mt-3 flex flex-wrap gap-1.5">
          <span v-for="tag in item.tags" :key="tag"
            class="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--color-accent)]">
            {{ tag }}
          </span>
          <span v-if="item.rhythmic"
            class="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--color-primary-hover)]">
            {{ item.rhythmic }}
          </span>
        </div>
      </div>
    </div>
    <!-- 加载中的诗词 -->
    <div v-if="loadingDetail" class="flex items-center justify-center py-6 text-xs text-[var(--color-text-muted)]">
      <Loader2 class="mr-2 size-3.5 animate-spin" /> 正在加载详情…
    </div>
  </div>
  <div v-else class="flex flex-1 items-center justify-center">
    <StateNotice title="暂无选中作品" description="请从左侧列表中选择一首诗词开始阅读" tone="empty" />
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import StateNotice from '@/components/StateNotice.vue'
import { usePoetryStore } from '@/stores/poetry'

const store = usePoetryStore()
const loadingDetail = ref(false)

const item = computed(() => store.selectedItem)

// 当选中项变化时自动加载详情
watch(() => store.selectedId, async (newId) => {
  if (!newId) return
  loadingDetail.value = true
  await store.ensureDetail(newId)
  loadingDetail.value = false
}, { immediate: true })
</script>
