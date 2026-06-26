<template>
  <article
    v-if="item"
    id="reader"
    class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
  >
    <!-- 头部信息（固定） -->
    <header class="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-4 py-3 sm:px-6">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <AppBadge tone="primary">{{ item.collection }}</AppBadge>
          <AppBadge v-if="item.rhythmic" tone="neutral">{{ item.rhythmic }}</AppBadge>
          <AppBadge tone="neutral">{{ item.length }} 字</AppBadge>
        </div>
        <div class="mt-2">
          <h1 class="text-xl font-semibold leading-tight text-[var(--color-text)] sm:text-2xl">
            {{ item.title }}
          </h1>
          <p class="mt-1 text-xs text-[var(--color-text-secondary)]">
            {{ item.dynasty }} · {{ item.author }}
          </p>
        </div>
      </div>
      <div class="flex shrink-0 gap-2">
        <AppButton variant="secondary" size="sm" @click="copyPoem">
          <CopyCheck v-if="copied" class="size-3.5" aria-hidden="true" />
          <Copy v-else class="size-3.5" aria-hidden="true" />
        </AppButton>
        <AppButton
          :variant="isFavorite ? 'primary' : 'secondary'"
          size="sm"
          @click="store.toggleFavorite(item.id)"
        >
          <Star class="size-3.5" :class="isFavorite ? 'fill-white' : ''" aria-hidden="true" />
        </AppButton>
      </div>
    </header>

    <!-- 正文区域（可滚动） -->
    <div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div class="flex flex-1 flex-col gap-6 px-4 py-5 sm:flex-row sm:px-6">
        <!-- 诗词正文 -->
        <div class="reader-paper min-h-0 flex-1 space-y-3 rounded-lg border border-white/70 bg-white/60 p-4 sm:p-6">
          <p
            v-for="(line, index) in item.paragraphs"
            :key="item.id + '-' + index"
            class="poem-line leading-relaxed text-[var(--color-text)]"
            :class="index === 0 ? 'text-[17px] sm:text-lg' : 'text-[15px] sm:text-[16px]'"
          >
            {{ line }}
          </p>
        </div>

        <!-- 侧边元信息 -->
        <aside class="min-w-0 shrink-0 space-y-3 sm:w-48">
          <section class="rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] p-3">
            <h2 class="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
              <Tags class="size-3.5" aria-hidden="true" />
              标签
            </h2>
            <div class="mt-2 flex flex-wrap gap-1.5">
              <AppBadge v-for="tag in item.tags" :key="tag" tone="accent" class="text-[10px]">{{ tag }}</AppBadge>
              <span v-if="!item.tags.length" class="text-xs text-[var(--color-text-muted)]">
                未提供标签
              </span>
            </div>
          </section>

          <section class="rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] p-3">
            <h2 class="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
              <FileText class="size-3.5" aria-hidden="true" />
              数据来源
            </h2>
            <p class="mt-1.5 break-all text-[11px] leading-5 text-[var(--color-text-muted)]">
              {{ item.sourcePath }}
            </p>
          </section>

          <p
            v-if="copied"
            class="rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary-soft)] px-3 py-2 text-xs text-[var(--color-primary-hover)]"
            role="status"
          >
            已复制到剪贴板
          </p>
        </aside>
      </div>
    </div>
  </article>

  <!-- 无选中作品时（如搜索无结果） -->
  <StateNotice
    v-else
    title="暂无选中作品"
    description="请从左侧列表中选择一首诗词开始阅读"
    tone="empty"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Copy, CopyCheck, FileText, Star, Tags } from 'lucide-vue-next'

import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import StateNotice from '@/components/StateNotice.vue'
import { usePoetryStore } from '@/stores/poetry'

const store = usePoetryStore()
const copied = ref(false)

const item = computed(() => store.selectedItem)
const isFavorite = computed(() => (item.value ? store.favorites.includes(item.value.id) : false))

async function copyPoem() {
  if (!item.value) return
  const text = item.value.title + '\n' + item.value.dynasty + ' · ' + item.value.author + '\n\n' + item.value.paragraphs.join('\n')
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    window.setTimeout(() => { copied.value = false }, 1800)
  } catch {
    // 静默失败
  }
}
</script>
