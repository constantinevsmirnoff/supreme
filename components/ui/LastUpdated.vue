<script setup lang="ts">
/**
 * Last Updated — Figma: Last Updated (node 22:4855)
 * Displays a "Last Updated:" label with date and info icon.
 */
withDefaults(
  defineProps<{
    /** Date string to display (e.g. "19/12/2025") */
    date?: string
    /** Label text above the date */
    label?: string
  }>(),
  { date: '', label: 'Last Updated:' }
)
</script>

<template>
  <div class="last-updated" data-name="Last Updated" role="group" aria-label="Last updated">
    <div class="last-updated__text">
      <p class="last-updated__label">{{ label }}</p>
      <p class="last-updated__date">{{ date }}</p>
    </div>
    <span class="last-updated__icon" aria-hidden="true">
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.55713 13.1143C5.65999 13.1143 4.81576 12.9429 4.02441 12.6001C3.23307 12.2616 2.53483 11.7897 1.92969 11.1846C1.32878 10.5794 0.856934 9.88118 0.51416 9.08984C0.171387 8.2985 0 7.45426 0 6.55713C0 5.65999 0.171387 4.81576 0.51416 4.02441C0.856934 3.23307 1.32878 2.53695 1.92969 1.93604C2.53483 1.33089 3.23096 0.856934 4.01807 0.51416C4.80941 0.171387 5.65365 0 6.55078 0C7.45215 0 8.2985 0.171387 9.08984 0.51416C9.88118 0.856934 10.5794 1.33089 11.1846 1.93604C11.7897 2.53695 12.2637 3.23307 12.6064 4.02441C12.9492 4.81576 13.1206 5.65999 13.1206 6.55713C13.1206 7.45426 12.9492 8.2985 12.6064 9.08984C12.2637 9.88118 11.7897 10.5794 11.1846 11.1846C10.5794 11.7897 9.88118 12.2616 9.08984 12.6001C8.2985 12.9429 7.45426 13.1143 6.55713 13.1143ZM6.55713 11.8193C7.28923 11.8193 7.97266 11.6839 8.60742 11.4131C9.24219 11.1423 9.80078 10.7656 10.2832 10.2832C10.7656 9.80078 11.1423 9.24219 11.4131 8.60742C11.6839 7.97266 11.8193 7.28923 11.8193 6.55713C11.8193 5.82926 11.6839 5.14795 11.4131 4.51318C11.1423 3.87419 10.7656 3.31348 10.2832 2.83105C9.80078 2.34863 9.24007 1.97201 8.60107 1.70117C7.96631 1.43034 7.28288 1.29492 6.55078 1.29492C5.82292 1.29492 5.13949 1.43034 4.50049 1.70117C3.86572 1.97201 3.30924 2.34863 2.83105 2.83105C2.35286 3.31348 1.97835 3.87419 1.70752 4.51318C1.43669 5.14795 1.30127 5.82926 1.30127 6.55713C1.30127 7.28923 1.43669 7.97266 1.70752 8.60742C1.97835 9.24219 2.35286 9.80078 2.83105 10.2832C3.31348 10.7656 3.87207 11.1423 4.50684 11.4131C5.14583 11.6839 5.82926 11.8193 6.55713 11.8193ZM5.44629 10.042C5.30241 10.042 5.1818 9.99756 5.08447 9.90869C4.99137 9.81559 4.94482 9.69922 4.94482 9.55957C4.94482 9.41992 4.99137 9.30566 5.08447 9.2168C5.1818 9.1237 5.30241 9.07715 5.44629 9.07715H6.20166V6.42383H5.56055C5.41667 6.42383 5.29606 6.37939 5.19873 6.29053C5.1014 6.19743 5.05273 6.08105 5.05273 5.94141C5.05273 5.80599 5.1014 5.69173 5.19873 5.59863C5.29606 5.50553 5.41667 5.45898 5.56055 5.45898H6.75391C6.93164 5.45898 7.06494 5.51611 7.15381 5.63037C7.24691 5.7404 7.29346 5.89062 7.29346 6.08105V9.07715H7.99805C8.14193 9.07715 8.26042 9.1237 8.35352 9.2168C8.45085 9.30566 8.49951 9.41992 8.49951 9.55957C8.49951 9.69922 8.45085 9.81559 8.35352 9.90869C8.26042 9.99756 8.14193 10.042 7.99805 10.042H5.44629ZM6.51904 4.4751C6.28206 4.4751 6.07894 4.39258 5.90967 4.22754C5.74463 4.05827 5.66211 3.85514 5.66211 3.61816C5.66211 3.37695 5.74463 3.17383 5.90967 3.00879C6.07894 2.83952 6.28206 2.75488 6.51904 2.75488C6.75602 2.75488 6.95703 2.83952 7.12207 3.00879C7.29134 3.17383 7.37598 3.37695 7.37598 3.61816C7.37598 3.85514 7.29134 4.05827 7.12207 4.22754C6.95703 4.39258 6.75602 4.4751 6.51904 4.4751Z" fill="currentColor"/>
      </svg>
    </span>
  </div>
</template>

<style scoped>
.last-updated {
  display: flex;
  align-items: center;
  gap: 15px;
}

.last-updated__text {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.last-updated__label {
  margin: 0;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-light);
  line-height: var(--typography-body-line-height);
  letter-spacing: var(--typography-body-letter-spacing);
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.last-updated__date {
  margin: 0;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.last-updated__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 13px;
  height: 13px;
  color: var(--color-text-tertiary);
}
</style>
