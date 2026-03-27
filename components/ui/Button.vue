<script setup lang="ts">
/**
 * Button — Figma: Push Button (node 26:5298)
 * Variants: Default (outline), Accent (primary), Half Accent (ghost), Danger
 * States: Default, Hover, Pressed, Focus, Inactive (disabled)
 */
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Visual variant */
    variant?: 'default' | 'accent' | 'half-accent' | 'danger'
    disabled?: boolean
  }>(),
  { variant: 'default', disabled: false }
)

const isHover = ref(false)
const isFocus = ref(false)

const variantClass = computed(() => `button--${props.variant}`)
const stateClass = computed(() => {
  if (props.disabled) return 'button--inactive'
  if (isFocus.value) return 'button--focus'
  if (isHover.value) return 'button--hover'
  return null
})
</script>

<template>
  <button
    type="button"
    class="button"
    :class="[variantClass, stateClass].filter(Boolean)"
    :disabled="disabled"
    @mouseenter="isHover = true"
    @mouseleave="isHover = false"
    @focus="isFocus = true"
    @blur="isFocus = false"
  >
    <span class="button__label"><slot>Title</slot></span>
  </button>
</template>

<style scoped>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 14px;
  border: 1px solid;
  border-radius: 5px;
  cursor: pointer;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-strong);
  line-height: 20px;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.button:focus {
  outline: none;
}

.button:active:not(:disabled) {
  border-width: 2px;
  padding: 5px 13px;
}

/* ========== Default (outline) ========== */
.button--default,
.button--default.button--focus {
  background-color: var(--color-white);
  border-color: var(--color-border-strong);
  color: var(--color-text-primary);
}

.button--default.button--hover {
  background-color: var(--color-primary-muted);
  border-color: var(--color-focus-ring);
  color: var(--color-primary);
}

.button--default.button--focus {
  border-color: var(--color-focus-ring);
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

.button--default.button--inactive {
  background-color: var(--color-white);
  border-color: var(--color-border-strong);
  color: var(--color-text-tertiary);
  opacity: 0.35;
  cursor: not-allowed;
}

/* ========== Accent (primary solid) ========== */
.button--accent,
.button--accent.button--focus {
  background-color: var(--color-primary);
  border-color: var(--color-focus-ring);
  color: var(--color-background-primary);
}

.button--accent.button--hover {
  background-color: var(--color-primary-dark);
  border-color: var(--color-focus-ring);
  color: var(--color-background-primary);
}

.button--accent:active:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.button--accent.button--focus {
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

.button--accent.button--inactive {
  background-color: var(--color-primary);
  border-color: var(--color-focus-ring);
  color: var(--color-background-primary);
  opacity: 0.36;
  cursor: not-allowed;
}

/* ========== Half Accent (ghost) ========== */
.button--half-accent {
  background-color: var(--color-white);
  border-color: var(--color-border-strong);
  color: var(--color-text-primary);
}

.button--half-accent.button--hover,
.button--half-accent.button--focus {
  background-color: var(--color-primary-muted);
  border-color: var(--color-focus-ring);
  color: var(--color-primary-dark);
}

.button--half-accent.button--focus {
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

.button--half-accent.button--inactive {
  background-color: var(--color-white);
  border-color: var(--color-border-strong);
  color: var(--color-text-tertiary);
  opacity: 0.35;
  cursor: not-allowed;
}

/* ========== Danger ========== */
.button--danger {
  background-color: var(--color-white);
  border-color: var(--color-critical);
  color: var(--color-critical);
}

.button--danger.button--hover {
  background-color: var(--color-critical-light);
  border-color: var(--color-critical);
  color: var(--color-critical);
}

.button--danger.button--focus {
  background-color: var(--color-white);
  border-width: 2px;
  border-color: var(--color-critical);
  color: var(--color-critical);
  padding: 5px 13px;
  box-shadow: 0 0 0 1px var(--color-critical);
}

.button--danger:active:not(:disabled) {
  background-color: var(--color-critical-light);
  border-width: 2px;
  padding: 5px 13px;
}

.button--danger.button--inactive {
  background-color: var(--color-white);
  border-color: var(--color-critical);
  color: var(--color-critical);
  opacity: 0.4;
  cursor: not-allowed;
}

.button__label {
  display: block;
  font-weight: 500;
  letter-spacing: -0.002em;
}
</style>
