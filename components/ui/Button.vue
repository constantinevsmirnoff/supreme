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
  min-width: 125px;
}

.button:focus {
  outline: none;
}

.button:active:not(:disabled):not(.button--accent) {
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

/* ========== Accent — frosted iridescent glass ========== */
.button--accent {
  position: relative;
  isolation: isolate;
  color: var(--color-text-primary);
  border-color: var(--color-accent-glass-border);
  background-color: transparent;
  -webkit-backdrop-filter: blur(8px) saturate(var(--saturate-accent-glass-backdrop));
  backdrop-filter: blur(8px) saturate(var(--saturate-accent-glass-backdrop));
  box-shadow: none;
  transition: box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.button--accent .button__label {
  position: relative;
  z-index: 1;
}

/* Iridescent colors: painted on ::before so we can mask + blur without affecting label text */
.button--accent::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: 0;
  pointer-events: none;
  background-image: linear-gradient(
    125deg,
    color-mix(in srgb, var(--color-accent-glass-sky) var(--opacity-accent-glass-fill), transparent) 0%,
    color-mix(in srgb, var(--color-accent-glass-peach) var(--opacity-accent-glass-fill), transparent) 22%,
    color-mix(in srgb, var(--color-accent-glass-mint) var(--opacity-accent-glass-fill), transparent) 42%,
    color-mix(in srgb, var(--color-accent-glass-mist) var(--opacity-accent-glass-fill), transparent) 55%,
    color-mix(in srgb, var(--color-accent-glass-rose) var(--opacity-accent-glass-fill), transparent) 78%,
    color-mix(in srgb, var(--color-accent-glass-lemon) var(--opacity-accent-glass-fill), transparent) 100%
  );
  background-size: var(--size-accent-glass-iris-width) 100%;
  background-position: var(--position-accent-glass-iris-x) var(--position-accent-glass-iris-y);
  background-repeat: no-repeat;
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    #fff var(--mask-accent-glass-iris-solid-from),
    #fff 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    #fff var(--mask-accent-glass-iris-solid-from),
    #fff 100%
  );
  -webkit-mask-size: var(--size-accent-glass-iris-width) 100%;
  mask-size: var(--size-accent-glass-iris-width) 100%;
  -webkit-mask-position: var(--position-accent-glass-iris-x) var(--position-accent-glass-iris-y);
  mask-position: var(--position-accent-glass-iris-x) var(--position-accent-glass-iris-y);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  filter: blur(8px);
}

.button--accent.button--hover::before {
  background-image: linear-gradient(
    125deg,
    color-mix(in srgb, var(--color-accent-glass-sky) var(--opacity-accent-glass-fill-hover), transparent) 0%,
    color-mix(in srgb, var(--color-accent-glass-peach) var(--opacity-accent-glass-fill-hover), transparent) 22%,
    color-mix(in srgb, var(--color-accent-glass-mint) var(--opacity-accent-glass-fill-hover), transparent) 42%,
    color-mix(in srgb, var(--color-accent-glass-mist) var(--opacity-accent-glass-fill-hover), transparent) 55%,
    color-mix(in srgb, var(--color-accent-glass-rose) var(--opacity-accent-glass-fill-hover), transparent) 78%,
    color-mix(in srgb, var(--color-accent-glass-lemon) var(--opacity-accent-glass-fill-hover), transparent) 100%
  );
}

.button--accent:focus:not(:disabled) {
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

/* Iridescent outer glow on hover — same palette / order as ::before (125° gradient).
   Uses :hover so it works alongside Vue’s single state class (hover vs focus). */
.button--accent:hover:not(:disabled):not(:active):not(.button--inactive) {
  box-shadow:
    -3px -2px 8px color-mix(in srgb, var(--color-accent-glass-sky) 38%, transparent),
    2px 5px 8px color-mix(in srgb, var(--color-accent-glass-peach) 34%, transparent),
    0 6px 8px color-mix(in srgb, var(--color-accent-glass-mint) 36%, transparent),
    0 0 8px color-mix(in srgb, var(--color-accent-glass-mist) 40%, transparent),
    -5px 2px 8px color-mix(in srgb, var(--color-accent-glass-rose) 32%, transparent),
    5px 2px 8px color-mix(in srgb, var(--color-accent-glass-lemon) 32%, transparent);
}

.button--accent:focus:hover:not(:disabled):not(:active):not(.button--inactive) {
  box-shadow:
    0 0 0 1px var(--color-focus-ring),
    -3px -2px 8px color-mix(in srgb, var(--color-accent-glass-sky) 38%, transparent),
    2px 5px 8px color-mix(in srgb, var(--color-accent-glass-peach) 34%, transparent),
    0 6px 8px color-mix(in srgb, var(--color-accent-glass-mint) 36%, transparent),
    0 0 8px color-mix(in srgb, var(--color-accent-glass-mist) 40%, transparent),
    -5px 2px 8px color-mix(in srgb, var(--color-accent-glass-rose) 32%, transparent),
    5px 2px 8px color-mix(in srgb, var(--color-accent-glass-lemon) 32%, transparent);
}

.button--accent:active:not(:disabled) {
  border-width: 1px;
  padding: 6px 14px;
  box-shadow: none;
}

.button--accent:focus:active:not(:disabled) {
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

.button--accent.button--inactive {
  color: var(--color-text-tertiary);
  border-color: var(--color-accent-glass-border);
  background-color: transparent;
  -webkit-backdrop-filter: blur(8px) saturate(var(--saturate-accent-glass-backdrop));
  backdrop-filter: blur(8px) saturate(var(--saturate-accent-glass-backdrop));
  box-shadow: none;
  opacity: 0.42;
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
