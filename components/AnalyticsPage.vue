<script setup lang="ts">
/**
 * Placeholder route for sidebar “Analytics” (Figma UI Kit sidebar 183:2548).
 */
</script>

<template>
  <div class="analytics-page">
    <main class="analytics-page__main">
      <h1 class="analytics-page__title">Analytics</h1>
      <p class="analytics-page__lead">This section is not wired yet.</p>
    </main>
  </div>
</template>

<style scoped>
.analytics-page {
  box-sizing: border-box;
  min-height: 100%;
  padding: var(--space-5xl) var(--space-4xl);
  background-color: var(--color-background-primary);
}

.analytics-page__main {
  box-sizing: border-box;
  max-width: 720px;
}

.analytics-page__title {
  margin: 0 0 var(--space-lg);
  font-family: var(--font-family-base);
  font-size: var(--typography-title-2-font-size);
  font-weight: var(--typography-title-2-font-weight-strong);
  line-height: var(--typography-title-2-line-height);
  letter-spacing: var(--typography-title-2-letter-spacing);
  color: var(--color-text-primary);
}

.analytics-page__lead {
  margin: 0;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-secondary);
}
</style>
