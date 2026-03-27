<script setup lang="ts">
/**
 * Three Dot Menu — Figma: Three Dot Menu (node 21:4871)
 * States: Default, Hover
 */
import { computed, ref } from 'vue'

defineProps<{
  disabled?: boolean
}>()

const isHover = ref(false)

const stateClass = computed(() => (isHover.value ? 'three-dot--hover' : 'three-dot--default'))
</script>

<template>
  <button
    type="button"
    class="three-dot"
    :class="stateClass"
    :disabled="disabled"
    aria-label="More options"
    @mouseenter="isHover = true"
    @mouseleave="isHover = false"
  >
    <span class="three-dot__icon" aria-hidden="true">
      <svg width="13" height="3" viewBox="0 0 13 3" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
        <circle cx="6.5" cy="1.5" r="1.5" fill="currentColor" />
        <circle cx="11.5" cy="1.5" r="1.5" fill="currentColor" />
      </svg>
    </span>
  </button>
</template>

<style scoped>
.three-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 1000px;
  background: transparent;
  cursor: pointer;
}

.three-dot:focus {
  outline: none;
}

.three-dot--default {
  background: transparent;
  border: 1px solid transparent;
}

.three-dot--default .three-dot__icon {
  color: var(--color-text-secondary);
}

.three-dot--hover {
  background-color: var(--color-primary-muted);
  border: 1px solid var(--color-focus-ring);
}

.three-dot--hover .three-dot__icon {
  color: var(--color-primary);
}

.three-dot:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.three-dot__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 13px;
  height: 3px;
  color: inherit;
}
</style>
