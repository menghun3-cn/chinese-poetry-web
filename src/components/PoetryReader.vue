<template>
  <article
    v-if="item"
    id="reader"
    class="paper-texture min-h-[560px] min-w-0 overflow-hidden rounded-lg border border-[var(--color-border)] p-4 shadow-[var(--shadow-card)] sm:p-6 xl:sticky xl:top-24"
  >
    <header class="grid gap-5 border-b border-[var(--color-border)] pb-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <AppBadge tone="primary">{{ item.collection }}</AppBadge>
          <AppBadge v-if="item.rhythmic" tone="neutral">{{ item.rhythmic }}</AppBadge>
          <AppBadge tone="neutral">{{ item.length }} 字</AppBadge>
        </div>

        <div class="mt-4 border-l-2 border-[var(--color-accent)] pl-4">
          <h1 class="text-2xl font-semibold leading-tight text-[var(--color-text)] sm:text-3xl">
            {{ item.title }}
          </h1>
          <p class="mt-2 text-sm text-[var(--color-text-secondary)]">
            {{ item.dynasty }} · {{ item.author }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 sm:flex">
        <AppButton variant="secondary" class="w-full sm:w-auto" @click="copyPoem">
          <CopyCheck v-if="copied" class="size-4" aria-hidden="true" />
          <Copy v-else class="size-4" aria-hidden="true" />
          {{ copied ? '已复制' : '复制' }}
        </AppButton>
        <AppButton
          :variant="isFavorite ? 'primary' : 'secondary'"
          class="w-full sm:w-auto"
          @click="store.toggleFavorite(item.id)"
        >
          <Star class="size-4" :class="isFavorite ? 'fill-white' : ''" aria-hidden="true" />
          {{ isFavorite ? '已收藏' : '收藏' }}
        </AppButton>
      </div>
    </header>

    <div class="grid min-w-0 gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_240px]">
      <div class="reader-paper space-y-3 rounded-lg border border-white/70 bg-white/60 p-4 sm:p-6">
        <p
          v-for="(line, index) in item.paragraphs"
          :key="`${item.id}-${index}`"
          class="poem-line text-[17px] text-[var(--color-text)] sm:text-lg"
        >
          {{ line }}
        </p>
      </div>

      <aside class="min-w-0 space-y-4">
        <section class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 class="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]">
            <Tags class="size-4" aria-hidden="true" />
            标签
          </h2>
          <div class="mt-2 flex flex-wrap gap-2">
            <AppBadge v-for="tag in item.tags" :key="tag" tone="accent">{{ tag }}</AppBadge>
            <span v-if="!item.tags.length" class="text-sm text-[var(--color-text-muted)]">
              原始数据未提供标签
            </span>
          </div>
        </section>

        <section class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 class="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]">
            <FileText class="size-4" aria-hidden="true" />
            数据来源
          </h2>
          <p class="mt-2 break-all text-xs leading-5 text-[var(--color-text-muted)]">
            {{ item.sourcePath }}
          </p>
        </section>

        <p
          v-if="copied"
          class="rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary-soft)] px-3 py-2 text-sm text-[var(--color-primary-hover)]"
          role="status"
        >
          已复制到剪贴板。
        </p>
        <p
          v-if="copyError"
          class="rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]"
          role="alert"
        >
          复制失败，请检查浏览器剪贴板权限后重试。
        </p>
      </aside>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Copy, CopyCheck, FileText, Star, Tags } from 'lucide-vue-next'

import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import { usePoetryStore } from '@/stores/poetry'

const store = usePoetryStore()
const copied = ref(false)
const copyError = ref(false)
const item = computed(() => store.selectedItem)
const isFavorite = computed(() => (item.value ? store.favorites.includes(item.value.id) : false))

async function copyPoem() {
  if (!item.value) return
  const text = `${item.value.title}\n${item.value.dynasty} · ${item.value.author}\n\n${item.value.paragraphs.join('\n')}`
  try {
    await navigator.clipboard.writeText(text)
    copyError.value = false
    copied.value = true
    window.setTimeout(() => {
      copied.value = false
    }, 1800)
  } catch {
    copied.value = false
    copyError.value = true
  }
}
</script>
