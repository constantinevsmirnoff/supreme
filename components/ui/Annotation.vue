<script setup lang="ts">
/**
 * Annotation — Figma UI Kit (node 111:790)
 * Frosted surface, border, elevation; 12px medium body for short helper copy.
 */
withDefaults(
  defineProps<{
    /** Default text when the default slot is empty */
    text?: string
  }>(),
  {
    text: 'Press & hold for 1 second to unlock'
  }
)
</script>

<template>
  <div class="annotation" role="note">
    <p class="annotation__text">
      <slot>{{ text }}</slot>
    </p>
  </div>
</template>

<style scoped>
.annotation {
  box-sizing: border-box;
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: max-content;
  max-width: 250px;
  padding: 8px;
  border: 1px solid var(--color-border-strong);
  border-radius: 8px;
  background-color: color-mix(in srgb, var(--color-white) 80%, transparent);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  box-shadow: 0 7px 22px 0 rgba(0, 0, 0, 0.25);
  font-family: var(--font-family-base);
}

.annotation__text {
  margin: 0;
  max-width: 100%;
  overflow-wrap: break-word;
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-light);
  line-height: var(--typography-body-line-height);
  letter-spacing: var(--typography-body-letter-spacing);
  color: var(--color-text-tertiary);
}
</style>
