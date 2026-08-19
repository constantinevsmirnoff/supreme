<script setup lang="ts">
/**
 * Ghost button — Figma: Ghost Button (node 123:1848)
 * Pill surface: white + backdrop blur, hairline border, card shadow; icon + label (body XL light).
 */
import { computed, ref } from 'vue'
import backArrowIconUrl from '@/icons/back_arrow.svg?url'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    showIcon?: boolean
  }>(),
  { disabled: false, type: 'button', showIcon: true }
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const isHover = ref(false)

const stateClass = computed(() => {
  if (props.disabled) return 'ghost-button--disabled'
  if (isHover.value) return 'ghost-button--hover'
  return null
})

function onClick (e: MouseEvent) {
  if (props.disabled) return
  emit('click', e)
}
</script>

<template>
  <button
    :type="type"
    class="ghost-button"
    :class="[stateClass].filter(Boolean)"
    :disabled="disabled"
    @mouseenter="isHover = true"
    @mouseleave="isHover = false"
    @click="onClick"
  >
    <span
      v-if="showIcon"
      class="ghost-button__icon-wrap"
      aria-hidden="true"
    >
      <slot name="icon">
        <img
          class="ghost-button__icon"
          :src="backArrowIconUrl"
          alt=""
        >
      </slot>
    </span>
    <span class="ghost-button__label">
      <slot>Remove manual overrides</slot>
    </span>
  </button>
</template>

<style scoped>
.ghost-button {
  display: inline-flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  box-sizing: border-box;
  padding: var(--space-md) var(--space-3xl);
  border: var(--border-width-hairline) solid var(--color-border-light);
  border-radius: var(--radius-xl);
  cursor: pointer;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-primary);
  background-color: var(--color-white);
  white-space: nowrap;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  box-shadow: var(--shadow-card-hover);
  -webkit-backdrop-filter: blur(var(--blur-backdrop-sm));
  backdrop-filter: blur(var(--blur-backdrop-sm));
}

.ghost-button:focus {
  outline: none;
}

.ghost-button:focus-visible {
  box-shadow:
    var(--shadow-card-hover),
    0 0 0 1px var(--color-focus-ring);
}

.ghost-button--hover {
  background-color: var(--color-background-secondary);
  border-color: var(--color-border-strong);
}

.ghost-button:active:not(:disabled) {
  background-color: var(--color-background-tertiary);
}

.ghost-button--disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.ghost-button__icon-wrap {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 10.052px;
  height: 10px;
}

.ghost-button__icon {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.ghost-button__label {
  display: block;
  flex-shrink: 0;
}

@media (prefers-reduced-motion: reduce) {
  .ghost-button {
    transition-duration: 0.01ms;
  }
}
</style>
