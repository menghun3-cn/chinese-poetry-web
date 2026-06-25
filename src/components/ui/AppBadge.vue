<template>
  <span
    :class="
      cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        toneClasses[tone],
      )
    "
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

withDefaults(
  defineProps<{
    tone?: 'neutral' | 'primary' | 'accent'
  }>(),
  {
    tone: 'neutral',
  },
)

const toneClasses = {
  neutral: 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]',
  primary:
    'border-transparent bg-[var(--color-primary-soft)] text-[var(--color-primary-hover)]',
  accent: 'border-transparent bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
}
</script>
