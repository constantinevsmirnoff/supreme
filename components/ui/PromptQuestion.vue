<script setup lang="ts">
/**
 * User prompt bubble — Figma Prompt (198:1874)
 * https://www.figma.com/design/e5qpHSeHPsA5LAF0zfjhAU/UI-Kit?node-id=198-1874
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
    class="prompt-question"
    data-name="Prompt"
    data-node-id="198:1874"
  >
    <div
      class="prompt-question__bubble"
      data-name="Question Container"
      data-node-id="198:1853"
    >
      <p class="prompt-question__body" data-node-id="198:1854">
        <slot>{{ text }}</slot>
      </p>
    </div>
  </div>
</template>

<style scoped>
.prompt-question {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 100%;
  min-width: 0;
}

.prompt-question__bubble {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  max-width: min(470px, 100%);
  padding: calc(var(--space-2xs) + var(--space-3xs)) var(--space-lg);
  border-radius: var(--radius-tab-slider-thumb);
  background-color: var(--color-background-tertiary);
}

.prompt-question__body {
  box-sizing: border-box;
  flex: 1 1 auto;
  min-width: 0;
  max-width: 450px;
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
