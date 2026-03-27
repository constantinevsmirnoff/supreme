<script setup lang="ts">
/**
 * Ghost button — Figma: GhostButton (node 95:538)
 * Icon + label; 1px border (--color-border-strong); fill from border-light; hover fill from border-strong.
 */
import { computed, ref } from 'vue'
import backArrowIconUrl from '@/icons/back_arrow.svg?url'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  { disabled: false, type: 'button' }
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
    <span class="ghost-button__icon-wrap" aria-hidden="true">
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
  gap: 6px;
  box-sizing: border-box;
  padding: 6px 14px;
  border: 1px solid var(--color-border-strong);
  border-radius: 5px;
  cursor: pointer;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-primary);
  background-color: var(--color-border-light);
  white-space: nowrap;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.05);
}

.ghost-button:focus {
  outline: none;
}

.ghost-button:focus-visible {
  box-shadow:
    0 2px 2px rgba(0, 0, 0, 0.05),
    0 0 0 1px var(--color-focus-ring);
}

.ghost-button--hover {
  background-color: var(--color-border-strong);
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
</style>
