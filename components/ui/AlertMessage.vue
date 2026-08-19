<script setup lang="ts">
/**
 * Alert / rules notice — Figma: Error Message (node 92:998)
 * Warm alert surface; header row (warning icon, title, close); body copy with indented block.
 */
import CloseButton from '@/components/ui/CloseButton.vue'
import warningIconUrl from '@/icons/warning.svg?url'

const props = withDefaults(
  defineProps<{
    title?: string
    /** Body lines below the header (Figma: two 12px Medium paragraphs, 10px gap) */
    paragraphs?: string[]
    /**
     * Narrow column next to another control (e.g. TagInput row): full width of parent,
     * no fixed 682px cap, text wraps to avoid horizontal overflow.
     */
    compact?: boolean
  }>(),
  {
    compact: false,
    title: 'Conditions overlap another template',
    paragraphs: () => [
      'Your Location conditions overlap another active template’s Location conditions. A job that fits both will only get one page template—the app picks the winner automatically, and it may not be the one you expect.',
      'Narrow the tags or add another field so each job clearly maps to one template.'
    ]
  }
)

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <aside
    class="alert-message"
    :class="{ 'alert-message--compact': compact }"
    role="alert"
    aria-live="polite"
  >
    <div class="alert-message__head">
      <img
        class="alert-message__icon"
        :src="warningIconUrl"
        alt=""
      >
      <p class="alert-message__title">
        {{ title }}
      </p>
      <CloseButton
        class="alert-message__close"
        aria-label="Dismiss notice"
        @click="emit('close')"
      />
    </div>
    <div class="alert-message__body">
      <p
        v-for="(line, i) in paragraphs"
        :key="i"
        class="alert-message__text"
      >
        {{ line }}
      </p>
    </div>
  </aside>
</template>

<style scoped>
.alert-message {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
  max-width: 682px;
  padding: 15px 25px;
  border-radius: 25px;
  background-color: var(--color-alert-muted);
  font-family: var(--font-family-base);
}

.alert-message__head {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.alert-message__icon {
  display: block;
  flex-shrink: 0;
  width: 12.387px;
  height: 11.244px;
}

.alert-message__title {
  flex: 1 1 0;
  margin: 0;
  min-width: 0;
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-strong);
  line-height: var(--typography-body-line-height);
  letter-spacing: var(--typography-body-letter-spacing);
  color: var(--color-text-secondary);
}

.alert-message__close {
  flex-shrink: 0;
}

.alert-message__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: stretch;
  box-sizing: border-box;
  width: 100%;
  padding: 0 60px 20px 22px;
  min-width: 0;
}

.alert-message__text {
  margin: 0;
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-light);
  line-height: var(--typography-body-line-height);
  letter-spacing: var(--typography-body-letter-spacing);
  color: var(--color-text-tertiary);
}

.alert-message--compact {
  max-width: 100%;
}

.alert-message--compact .alert-message__body {
  padding-right: 16px;
}

.alert-message--compact .alert-message__text {
  overflow-wrap: break-word;
}
</style>
