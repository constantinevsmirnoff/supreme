<script setup lang="ts">
/**
 * Status indicator — Figma: Status (node 7:4372)
 * States: Active (default), Inactive (disabled)
 */
defineProps<{
  /** true = active (green), false = inactive (gray) */
  active?: boolean
}>()
</script>

<template>
  <span
    class="status-dot"
    :class="{ 'status-dot--inactive': !active }"
    role="status"
    :aria-label="active ? 'Active' : 'Inactive'"
  />
</template>

<style scoped>
.status-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--color-success);
  flex-shrink: 0;
  vertical-align: middle;
  line-height: 0;
}

.status-dot--inactive {
  background-color: var(--color-text-tertiary);
}
</style>
