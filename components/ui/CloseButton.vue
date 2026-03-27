<script setup lang="ts">
/**
 * Close button — Figma: CloseButton (node 80:5719)
 * Icon from icons/x.svg; default: no bg, tertiary X; hover: circular background-tertiary, secondary X.
 */
import { computed, ref } from 'vue'
import xIconUrl from '@/icons/x.svg?url'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    /** Accessible name (e.g. “Close dialog”) */
    ariaLabel?: string
  }>(),
  { disabled: false, ariaLabel: 'Close' }
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const isHover = ref(false)

const stateClass = computed(() => {
  if (props.disabled) return 'close-button--disabled'
  if (isHover.value) return 'close-button--hover'
  return 'close-button--default'
})

const glyphMaskStyle = computed(() => {
  const u = `url("${xIconUrl}")`
  return {
    WebkitMaskImage: u,
    maskImage: u,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain'
  } as Record<string, string>
})

function onClick (e: MouseEvent) {
  if (props.disabled) return
  emit('click', e)
}
</script>

<template>
  <button
    type="button"
    class="close-button"
    :class="stateClass"
    :disabled="disabled"
    :aria-label="ariaLabel"
    @mouseenter="isHover = true"
    @mouseleave="isHover = false"
    @click="onClick"
  >
    <span class="close-button__bg" aria-hidden="true" />
    <span
      class="close-button__glyph"
      aria-hidden="true"
      :style="glyphMaskStyle"
    />
  </button>
</template>

<style scoped>
.close-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.close-button:focus {
  outline: none;
}

.close-button:focus-visible {
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

.close-button__bg {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background-color: transparent;
  pointer-events: none;
}

.close-button--default .close-button__glyph {
  background-color: var(--color-text-tertiary);
}

.close-button--hover .close-button__bg {
  background-color: var(--color-background-tertiary);
}

.close-button--hover .close-button__glyph {
  background-color: var(--color-text-secondary);
}

.close-button--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.close-button--disabled .close-button__glyph {
  background-color: var(--color-text-tertiary);
}

.close-button__glyph {
  position: relative;
  z-index: 1;
  display: block;
  width: 11px;
  height: 11px;
}
</style>
