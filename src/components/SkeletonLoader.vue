<template>
  <div class="loader-root">
    <div class="loader-brand">
      <svg class="loader-logo" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill="var(--color-primary)" opacity="0.1" />
        <path d="M16 28c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round" />
        <path d="M12 34c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round" opacity="0.5" />
        <circle cx="28" cy="22" r="2" fill="var(--color-primary)" />
      </svg>
      <div>
        <p class="loader-title">中华诗词典藏</p>
        <p class="loader-subtitle">Chinese Poetry Archive</p>
      </div>
    </div>

    <div class="loader-progress-track">
      <div class="loader-progress-fill" :style="{ width: Math.min(progress, 100) + '%' }" />
    </div>

    <div class="loader-message">
      <span class="loader-dot" />
      <span>{{ message }}</span>
      <span v-if="progress > 0" class="loader-percent">{{ Math.round(Math.min(progress, 100)) }}%</span>
      <span v-if="loadedCount > 0" class="loader-count">（{{ loadedCount.toLocaleString() }} / {{ totalCount.toLocaleString() }} 首）</span>
    </div>

    <div class="loader-skeleton">
      <div class="loader-skeleton-card">
        <div class="loader-skeleton-block" style="width:45%" />
        <div class="loader-skeleton-block" style="width:65%" />
        <div class="loader-skeleton-line" />
        <div class="loader-skeleton-line" />
        <div class="loader-skeleton-line" style="width:80%" />
        <div class="loader-skeleton-line" style="width:55%" />
        <div class="loader-skeleton-line" style="width:70%" />
        <div class="loader-skeleton-line" style="width:40%" />
      </div>
    </div>

    <p class="loader-footer">
      全唐诗 · 全宋诗 · 全宋词 · 元曲 · 38万+ 首
    </p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    progress?: number
    message?: string
    loadedCount?: number
    totalCount?: number
  }>(),
  { progress: 0, message: '正在加载索引...', loadedCount: 0, totalCount: 0 },
)
</script>

<style scoped>
.loader-root {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  padding: 2rem;
  min-height: 60vh;
}

.loader-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.loader-logo {
  width: 2.5rem;
  height: 2.5rem;
  animation: loader-pulse 2s ease-in-out infinite;
}

@keyframes loader-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.95); }
}

.loader-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: 0.08em;
}

.loader-subtitle {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.loader-progress-track {
  width: 100%;
  max-width: 20rem;
  height: 0.375rem;
  overflow: hidden;
  border-radius: 9999px;
  background: var(--color-border);
}

.loader-progress-fill {
  height: 100%;
  border-radius: 9999px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  transition: width 0.5s ease-out;
}

.loader-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.loader-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--color-primary);
  animation: loader-blink 1.2s ease-in-out infinite;
}

@keyframes loader-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}

.loader-percent {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  color: var(--color-primary);
}

.loader-count {
  font-variant-numeric: tabular-nums;
  font-size: 0.6875rem;
  color: var(--color-text-muted);
}

.loader-skeleton {
  width: 100%;
  max-width: 28rem;
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.loader-skeleton-card {
  border-radius: 1rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.loader-skeleton-block {
  height: 1rem;
  border-radius: 0.375rem;
  background: var(--color-border);
}

.loader-skeleton-line {
  width: 90%;
  height: 0.75rem;
  border-radius: 0.25rem;
  background: var(--color-border);
}

.loader-footer {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  opacity: 0.6;
}
</style>
