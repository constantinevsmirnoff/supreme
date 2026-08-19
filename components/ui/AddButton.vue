<script setup lang="ts">
/**
 * Add button — Figma: AddButton (node 85:6447)
 * Icon from icons/plus.svg; default: no bg, tertiary plus; hover: circular background-tertiary, secondary plus.
 */
import { computed, ref } from 'vue'
import plusIconUrl from '@/icons/plus.svg?url'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    /** Accessible name (e.g. “Add item”) */
    ariaLabel?: string
    /** Show hover visuals while pointer is over a parent (e.g. TagInput) */
    parentHover?: boolean
  }>(),
  { disabled: false, ariaLabel: 'Add', parentHover: false }
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const isHover = ref(false)

const stateClass = computed(() => {
  if (props.disabled) return 'add-button--disabled'
  if (isHover.value || props.parentHover) return 'add-button--hover'
  return 'add-button--default'
})

const glyphMaskStyle = computed(() => {
  const u = `url("${plusIconUrl}")`
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
    class="add-button"
    :class="stateClass"
    :disabled="disabled"
    :aria-label="ariaLabel"
    @mouseenter="isHover = true"
    @mouseleave="isHover = false"
    @click="onClick"
  >
    <span class="add-button__bg" aria-hidden="true" />
    <span
      class="add-button__glyph"
      aria-hidden="true"
      :style="glyphMaskStyle"
    />
  </button>
</template>

<style scoped>
.add-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.add-button:focus {
  outline: none;
}

.add-button:focus-visible {
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

.add-button__bg {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background-color: transparent;
  pointer-events: none;
  transition: background-color 0.22s ease;
}

.add-button--default .add-button__glyph {
  background-color: var(--color-text-tertiary);
}

.add-button--hover .add-button__bg {
  background-color: var(--color-background-tertiary);
}

.add-button--hover .add-button__glyph {
  background-color: var(--color-text-secondary);
}

.add-button--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.add-button--disabled .add-button__glyph {
  background-color: var(--color-text-tertiary);
}

.add-button__glyph {
  position: relative;
  z-index: 1;
  display: block;
  width: 12px;
  height: 12px;
  transition: background-color 0.22s ease;
}
</style>
