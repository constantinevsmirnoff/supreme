<script setup lang="ts">
/**
 * Assigned job summary — Figma: Assigned Job (node 86:7077)
 * Title (Title 3 / strong, secondary); meta row: location | industry | company (Body 12 light, tertiary).
 */
defineProps<{
  jobTitle: string
  location: string
  industry: string
  company: string
}>()
</script>

<template>
  <div class="assigned-job">
    <p class="assigned-job__title">{{ jobTitle }}</p>
    <div class="assigned-job__meta">
      <span class="assigned-job__meta-item">{{ location }}</span>
      <span class="assigned-job__divider" aria-hidden="true" />
      <span class="assigned-job__meta-item">{{ industry }}</span>
      <span class="assigned-job__divider" aria-hidden="true" />
      <span class="assigned-job__meta-item assigned-job__meta-item--company">{{ company }}</span>
    </div>
  </div>
</template>

<style scoped>
.assigned-job {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  width: 100%;
  max-width: 676px;
  font-family: var(--font-family-base);
}

.assigned-job__title {
  margin: 0;
  width: 100%;
  font-size: var(--typography-title-3-font-size);
  font-weight: var(--typography-title-3-font-weight-strong);
  line-height: var(--typography-title-3-line-height);
  letter-spacing: var(--typography-title-3-letter-spacing);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.assigned-job__meta {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.assigned-job__meta-item {
  flex-shrink: 0;
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-light);
  line-height: var(--typography-body-line-height);
  letter-spacing: var(--typography-body-letter-spacing);
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.assigned-job__meta-item--company {
  flex: 1 1 0;
  min-width: 0;
}

.assigned-job__divider {
  width: 1px;
  height: 15px;
  background-color: var(--color-border-strong);
  flex-shrink: 0;
}
</style>
