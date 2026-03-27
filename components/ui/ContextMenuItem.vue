<script setup lang="ts">
/**
 * Context menu row — Figma: ContextMenuItem (node 86:6592)
 * Default: transparent; hover: background-tertiary. Intended inside role="menu".
 * Wrap the menu panel (role="menu") with class `context-menu` for open animation (opacity + scale); labels are not animated.
 * Host menus (e.g. DropdownSelector, JobTemplateOverlay picker) close on document scroll while ignoring scroll inside the panel.
 */
const props = withDefaults(
  defineProps<{
    /** Visible label when default slot is empty */
    label?: string
    disabled?: boolean
  }>(),
  { label: 'Item', disabled: false }
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

function onClick (e: MouseEvent) {
  if (props.disabled) return
  emit('click', e)
}
</script>

<template>
  <button
    type="button"
    class="context-menu-item"
    :class="{ 'context-menu-item--disabled': props.disabled }"
    role="menuitem"
    :disabled="props.disabled"
    @click="onClick"
  >
    <span class="context-menu-item__label">
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>

<style scoped>
.context-menu-item {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  min-height: 28px;
  margin: 0;
  padding: 0 8px;
  border: none;
  border-radius: 5px;
  background: transparent;
  cursor: pointer;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-secondary);
  text-align: left;
}

.context-menu-item:focus {
  outline: none;
}

.context-menu-item:focus-visible {
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

.context-menu-item:hover:not(:disabled) {
  background-color: var(--color-background-tertiary);
}

.context-menu-item--disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.context-menu-item__label {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@keyframes context-menu-panel-open {
  from {
    opacity: 0;
    transform: scale(0.96);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

:global(.context-menu) {
  transform-origin: top center;
  animation: context-menu-panel-open 0.22s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  :global(.context-menu) {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
