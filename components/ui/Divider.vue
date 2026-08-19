<script setup lang="ts">
/**
 * Section divider with label — Figma UI Kit Divider (158:1864)
 */
withDefaults(
  defineProps<{
    /** Section caption; displayed in uppercase via typography tokens */
    label?: string
  }>(),
  {
    label: 'Manual'
  }
)
</script>

<template>
  <div class="divider" role="separator" aria-orientation="horizontal">
    <span class="divider__label">{{ label }}</span>
  </div>
</template>

<style scoped>
.divider {
  box-sizing: border-box;
  display: flex;
  width: 100%;
  align-items: flex-start;
  padding: var(--space-md) 0;
  border-bottom: var(--border-width-hairline) solid var(--color-border-strong);
}

.divider__label {
  flex: 1 1 0;
  min-width: 0;
  min-height: 1px;
  overflow: hidden;
  font-family: var(--font-family-base);
  font-size: var(--typography-divider-label-font-size);
  font-weight: var(--typography-divider-label-font-weight);
  font-style: normal;
  line-height: var(--typography-divider-label-line-height);
  letter-spacing: var(--typography-divider-label-letter-spacing);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
