<template>
  <article
    v-if="item"
    class="paper-texture min-h-[520px] rounded-xl border border-[var(--color-border)] p-5 shadow-[var(--shadow-card)] sm:p-7"
  >
    <header class="border-b border-[var(--color-border)] pb-5">
      <div class="flex flex-wrap items-center gap-2">
        <AppBadge tone="primary">{{ item.collection }}</AppBadge>
        <AppBadge v-if="item.rhythmic" tone="neutral">{{ item.rhythmic }}</AppBadge>
        <AppBadge tone="neutral">{{ item.length }} 字</AppBadge>
      </div>

      <div class="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 class="text-2xl font-semibold leading-tight text-[var(--color-text)] sm:text-3xl">
            {{ item.title }}
          </h1>
          <p class="mt-2 text-sm text-[var(--color-text-secondary)]">
            {{ item.dynasty }} · {{ item.author }}
          </p>
        </div>

        <div class="flex gap-2">
          <AppButton variant="secondary" @click="copyPoem">
            <Copy class="size-4" aria-hidden="true" />
            复制
          </AppButton>
          <AppButton
            :variant="isFavorite ? 'primary' : 'secondary'"
            @click="store.toggleFavorite(item.id)"
          >
            <Star class="size-4" aria-hidden="true" />
            {{ isFavorite ? '已藏' : '收藏' }}
          </AppButton>
        </div>
      </div>
    </header>

    <div class="grid gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div class="space-y-3 rounded-lg bg-white/55 p-4 sm:p-6">
        <p v-for="(line, index) in item.paragraphs" :key="`${item.id}-${index}`" class="poem-line text-lg">
          {{ line }}
        </p>
      </div>

      <aside class="space-y-4">
        <section>
          <h2 class="text-sm font-semibold text-[var(--color-text-secondary)]">标签</h2>
          <div class="mt-2 flex flex-wrap gap-2">
            <AppBadge v-for="tag in item.tags" :key="tag" tone="accent">{{ tag }}</AppBadge>
            <span v-if="!item.tags.length" class="text-sm text-[var(--color-text-muted)]">
              原始数据未提供标签
            </span>
          </div>
        </section>

        <section>
          <h2 class="text-sm font-semibold text-[var(--color-text-secondary)]">数据来源</h2>
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
      </aside>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Copy, Star } from 'lucide-vue-next'

import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import { usePoetryStore } from '@/stores/poetry'

const store = usePoetryStore()
const copied = ref(false)
const item = computed(() => store.selectedItem)
const isFavorite = computed(() => (item.value ? store.favorites.includes(item.value.id) : false))

async function copyPoem() {
  if (!item.value) return
  const text = `${item.value.title}\n${item.value.dynasty} · ${item.value.author}\n\n${item.value.paragraphs.join('\n')}`
  await navigator.clipboard.writeText(text)
  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 1800)
}
</script>
