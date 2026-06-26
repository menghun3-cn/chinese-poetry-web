<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="全部作者"
      @click.self="$emit('close')"
    >
      <div
        class="relative mx-4 w-full max-w-2xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-popover)]"
      >
        <!-- 头部 -->
        <header class="flex items-center justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">
          <div class="min-w-0">
            <h2 class="text-lg font-semibold">全部作者</h2>
            <p class="mt-0.5 text-sm text-[var(--color-text-muted)]">
              共 {{ allAuthors.length }} 位作者
            </p>
          </div>
          <button
            class="flex size-9 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
            aria-label="关闭"
            @click="$emit('close')"
          >
            <X class="size-5" />
          </button>
        </header>

        <!-- 搜索 -->
        <div class="border-b border-[var(--color-border)] px-5 py-3">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" aria-hidden="true" />
            <input
              v-model="searchQuery"
              type="text"
              class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] py-2 pl-9 pr-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition focus:border-[var(--color-primary)] focus:outline-none"
              placeholder="搜索作者…"
            />
          </div>
        </div>

        <!-- 作者列表 -->
        <div class="max-h-[480px] overflow-y-auto px-5 py-4">
          <div
            v-if="displayAuthors.length"
            class="grid gap-2 sm:grid-cols-2 md:grid-cols-3"
          >
            <button
              v-for="author in displayAuthors"
              :key="author.name"
              class="group flex min-h-[52px] items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition"
              :class="
                store.filters.author === author.name
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] shadow-[inset_3px_0_0_var(--color-accent)]'
                  : 'border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]'
              "
              :aria-pressed="store.filters.author === author.name"
              @click="selectAuthor(author.name)"
            >
              <span
                class="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                :class="
                  store.filters.author === author.name
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
                "
              >
                {{ author.name.charAt(0) }}
              </span>
              <span class="min-w-0">
                <span class="block truncate text-sm font-medium">{{ author.name }}</span>
                <span class="block text-[11px] text-[var(--color-text-muted)]">{{ author.count }} 首</span>
              </span>
            </button>
          </div>

          <p v-else class="py-12 text-center text-sm text-[var(--color-text-muted)]">
            没有匹配的作者
          </p>
        </div>

        <!-- 底部 -->
        <footer v-if="store.filters.author" class="flex items-center justify-end border-t border-[var(--color-border)] px-5 py-3">
          <button
            class="text-sm font-medium text-[var(--color-primary-hover)] transition hover:underline"
            @click="clearAuthor"
          >
            清除作者筛选
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search, X } from 'lucide-vue-next'

import { usePoetryStore } from '@/stores/poetry'

defineEmits<{
  close: []
}>()

const store = usePoetryStore()
const searchQuery = ref('')

const allAuthors = computed(() => {
  const counter = new Map<string, number>()
  for (const item of store.items) {
    if (item.author && item.author !== '佚名')
      counter.set(item.author, (counter.get(item.author) ?? 0) + 1)
  }
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))
})

const displayAuthors = computed(() => {
  const q = searchQuery.value.trim().toLocaleLowerCase('zh-CN')
  if (!q) return allAuthors.value
  return allAuthors.value.filter((a) => a.name.toLocaleLowerCase('zh-CN').includes(q))
})

function selectAuthor(author: string) {
  store.updateFilters({ author: store.filters.author === author ? '' : author })
}

function clearAuthor() {
  store.updateFilters({ author: '' })
}
</script>
