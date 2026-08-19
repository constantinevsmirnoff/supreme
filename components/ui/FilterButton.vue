<script setup lang="ts">
/**
 * Filter button — Figma: Filter (node 146:792)
 * Default / hover: 36×36 icon; active: primary-muted surface + optional count badge on primary pill.
 */
import { computed, ref } from 'vue'
import slidersIconUrl from '@/icons/sliders.svg?url'

const props = withDefaults(
  defineProps<{
    /** Active filters applied (expanded layout + badge when count &gt; 0) */
    active?: boolean
    /** Shown in badge when `active` and &gt; 0 */
    filterCount?: number
    disabled?: boolean
    ariaLabel?: string
  }>(),
  {
    active: false,
    filterCount: 0,
    disabled: false,
    ariaLabel: 'Filters'
  }
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const isHover = ref(false)

const showBadge = computed(
  () => props.active && props.filterCount > 0
)

/** Active styling without count badge: icon only in muted surface */
const activeCompact = computed(
  () => props.active && props.filterCount <= 0
)

const iconMaskStyle = computed(() => {
  const u = `url("${slidersIconUrl}")`
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

const stateClass = computed(() => {
  if (props.disabled) return 'filter-button--disabled'
  if (props.active) return 'filter-button--active'
  if (isHover.value) return 'filter-button--hover'
  return 'filter-button--default'
})

function onClick (e: MouseEvent) {
  if (props.disabled) return
  emit('click', e)
}
</script>

<template>
  <button
    type="button"
    class="filter-button"
    :class="[stateClass, { 'filter-button--active-compact': activeCompact }]"
    :disabled="disabled"
    :aria-label="ariaLabel"
    :aria-pressed="active"
    @mouseenter="isHover = true"
    @mouseleave="isHover = false"
    @click="onClick"
  >
    <span class="filter-button__icon-wrap" aria-hidden="true">
      <span class="filter-button__icon" :style="iconMaskStyle" />
    </span>
    <Transition name="filter-button-badge">
      <span
        v-if="showBadge"
        class="filter-button__badge"
        aria-hidden="true"
      >{{ filterCount > 99 ? '99+' : filterCount }}</span>
    </Transition>
  </button>
</template>

<style scoped>
.filter-button {
  box-sizing: border-box;
  display: inline-flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-2xs);
  width: auto;
  min-width: 36px;
  max-width: 36px;
  height: 36px;
  padding: var(--space-3xs) var(--space-xl);
  border-width: var(--border-width-hairline);
  border-style: solid;
  border-color: var(--color-border-strong);
  border-radius: var(--space-4xl);
  background-color: var(--color-white);
  cursor: pointer;
  flex-shrink: 0;
  transition:
    max-width 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    padding 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    background-color 0.22s ease,
    border-color 0.22s ease,
    box-shadow 0.18s ease;
}

.filter-button--default {
  padding: 0;
}

.filter-button--hover:not(.filter-button--disabled):not(.filter-button--active) {
  padding: 0;
  background-color: var(--color-background-tertiary);
  border-color: var(--color-border-strong);
}

.filter-button--active {
  max-width: min(320px, 100vw);
  padding: var(--space-3xs) var(--space-xl);
  border-color: var(--color-primary-muted);
  background-color: var(--color-primary-muted);
}

.filter-button--active.filter-button--active-compact {
  max-width: 36px;
  padding: 0;
}

.filter-button:focus {
  outline: none;
}

.filter-button:focus-visible {
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

.filter-button--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.filter-button__icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 12px;
  flex-shrink: 0;
}

.filter-button__icon {
  display: block;
  width: 100%;
  height: 100%;
  background-color: var(--color-text-secondary);
  transition: background-color 0.22s ease;
}

.filter-button--active .filter-button__icon {
  background-color: var(--color-primary);
}

.filter-button--hover:not(.filter-button--disabled):not(.filter-button--active)
  .filter-button__icon {
  background-color: var(--color-text-secondary);
}

.filter-button__badge {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: var(--space-2xs);
  border-radius: var(--space-5xl);
  background-color: var(--color-primary);
  font-family: var(--font-family-base);
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-light);
  line-height: 1;
  letter-spacing: -0.015em;
  color: var(--color-white);
}

.filter-button-badge-enter-active,
.filter-button-badge-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.filter-button-badge-enter-from,
.filter-button-badge-leave-to {
  opacity: 0;
  transform: scale(0.88);
}

@media (prefers-reduced-motion: reduce) {
  .filter-button,
  .filter-button__icon {
    transition-duration: 0.01ms;
  }

  .filter-button-badge-enter-active,
  .filter-button-badge-leave-active {
    transition-duration: 0.01ms;
  }
}
</style>
