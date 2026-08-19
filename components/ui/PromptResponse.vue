<script setup lang="ts">
/**
 * Assistant / system reply row — Figma Response (198:1873)
 * https://www.figma.com/design/e5qpHSeHPsA5LAF0zfjhAU/UI-Kit?node-id=198-1873
 */
withDefaults(
  defineProps<{
    /** Message copy (default slot overrides when provided) */
    text?: string
  }>(),
  { text: '' }
)
</script>

<template>
  <div
    class="prompt-response"
    data-name="Response"
    data-node-id="198:1873"
  >
    <div class="prompt-response__inner" data-node-id="198:1845">
      <p class="prompt-response__body">
        <slot>{{ text }}</slot>
      </p>
    </div>
  </div>
</template>

<style scoped>
.prompt-response {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  width: 100%;
  min-width: 0;
  max-width: 650px;
}

.prompt-response__inner {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  padding: calc(var(--space-2xs) + var(--space-3xs)) var(--space-lg);
  border-radius: var(--radius-tab-slider-thumb);
  background-color: var(--color-background-secondary);
}

.prompt-response__body {
  box-sizing: border-box;
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-large-font-size);
  font-weight: var(--typography-body-large-font-weight-light);
  line-height: var(--typography-body-large-line-height-light);
  letter-spacing: var(--typography-body-large-letter-spacing-light);
  color: var(--color-text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
