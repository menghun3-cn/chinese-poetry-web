<template>
  <section
    class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-[var(--shadow-card)]"
    :role="tone === 'danger' ? 'alert' : 'status'"
  >
    <component
      :is="iconMap[tone]"
      class="mx-auto mb-3 size-8 text-[var(--color-primary)]"
      :class="tone === 'loading' ? 'animate-spin' : ''"
      aria-hidden="true"
    />
    <h2 class="text-lg font-semibold">{{ title }}</h2>
    <p class="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">
      {{ description }}
    </p>
    <div v-if="$slots.default" class="mt-4">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { AlertTriangle, LoaderCircle, SearchX } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    title: string
    description: string
    tone?: 'loading' | 'empty' | 'danger'
  }>(),
  {
    tone: 'empty',
  },
)

const iconMap = {
  loading: LoaderCircle,
  empty: SearchX,
  danger: AlertTriangle,
}
</script>
