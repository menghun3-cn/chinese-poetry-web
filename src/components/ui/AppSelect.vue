<template>
  <label class="block">
    <span v-if="label" class="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
      {{ label }}
    </span>
    <select
      :value="modelValue"
      class="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <slot />
    </select>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  label?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
