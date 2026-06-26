<template>
  <div class="space-y-6">
    <!-- 进度条 -->
    <div class="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
      <div
        class="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500 ease-out"
        :style="{ width: Math.min(progress, 100) + '%' }"
      />
    </div>

    <!-- 提示文字 -->
    <p class="text-center text-sm text-[var(--color-text-muted)]">
      正在加载诗词索引
      <span v-if="progress > 0" class="ml-1 text-xs">
        {{ Math.min(progress, 100) }}%
      </span>
    </p>

    <!-- 骨架占位 -->
    <div class="animate-pulse space-y-6">
      <section class="rounded-lg border border-[var(--color-border)] p-4 sm:p-6 lg:p-7">
        <div class="mb-6 flex items-center gap-2">
          <div class="size-4 rounded bg-[var(--color-border)]" />
          <div class="h-4 w-20 rounded bg-[var(--color-border)]" />
        </div>
        <div class="mb-3 h-8 w-72 rounded bg-[var(--color-border)]" />
        <div class="mb-6 h-5 w-96 rounded bg-[var(--color-border)]" />
        <div class="mt-8 space-y-3">
          <div v-for="i in 8" :key="i" class="h-6 rounded bg-[var(--color-border)]" :style="{ width: (60 + i * 4) + '%' }" />
        </div>
      </section>
      <div class="grid gap-4 sm:grid-cols-3">
        <div v-for="i in 3" :key="i" class="h-24 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div class="mb-2 h-4 w-16 rounded bg-[var(--color-border)]" />
          <div class="h-8 w-20 rounded bg-[var(--color-border)]" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    progress?: number
  }>(),
  {
    progress: 0,
  },
)
</script>
