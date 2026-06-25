<template>
  <label class="block">
    <span v-if="label" class="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
      {{ label }}
    </span>
    <span class="relative block">
      <component
        :is="icon"
        v-if="icon"
        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]"
        aria-hidden="true"
      />
      <input
        :value="modelValue"
        :placeholder="placeholder"
        :class="
          cn(
            'h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] transition placeholder:text-[var(--color-text-muted)]',
            icon ? 'pl-9' : '',
          )
        "
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </span>
  </label>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

import { cn } from '@/lib/utils'

defineProps<{
  modelValue: string
  label?: string
  placeholder?: string
  icon?: Component
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
