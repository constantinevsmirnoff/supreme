<script setup lang="ts">
/**
 * Job List Header — Figma: Header (node 27:5050)
 * Action row: optional outline + accent `Button` components, 10px gap (styles from `components/ui/Button.vue`).
 */
import Button from '@/components/ui/Button.vue'
import GhostButton from '@/components/ui/GhostButton.vue'
import SearchField from '@/components/ui/SearchField.vue'

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    /** Placeholder text for the search field */
    searchPlaceholder?: string
    searchQuery?: string
    /** Outline action (left) — Figma Push Button default */
    secondaryActionLabel?: string
    /** Primary action (right) — Figma Push Button accent */
    primaryActionLabel?: string
    /** When false, the outline (secondary) button is omitted */
    showSecondaryAction?: boolean
    /** When false, “Remove manual overrides” ghost button is hidden (e.g. Page Manager) */
    showClearManualOverrides?: boolean
  }>(),
  {
    title: 'Jobs',
    description:
      'Here you will find all the jobs available for your JobShop. You can edit your jobs, publish them or deactivate them after they have been successfully filled.',
    searchPlaceholder: 'Search…',
    searchQuery: '',
    secondaryActionLabel: 'Create new template',
    primaryActionLabel: 'Create new job',
    showSecondaryAction: true,
    showClearManualOverrides: true
  }
)

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'clear-manual-overrides': []
  /** Accent / primary button (e.g. “New +” on Page Manager) */
  'primary-action': []
}>()
</script>

<template>
  <header class="job-list-header" data-name="Header">
    <div class="job-list-header__inner">
      <div class="job-list-header__content">
        <h1 class="job-list-header__title">{{ title }}</h1>
        <p class="job-list-header__description">{{ description }}</p>
      </div>
      <div class="job-list-header__actions">
        <Button v-if="showSecondaryAction" variant="default">{{ secondaryActionLabel }}</Button>
        <Button variant="accent" @click="emit('primary-action')">
          {{ primaryActionLabel }}
        </Button>
      </div>
    </div>
    <div class="job-list-header__search">
      <SearchField
        class="job-list-header__search-field"
        :model-value="props.searchQuery"
        :placeholder="props.searchPlaceholder"
        @update:model-value="emit('update:searchQuery', $event)"
      />
      <GhostButton
        v-if="showClearManualOverrides"
        @click="emit('clear-manual-overrides')"
      />
    </div>
  </header>
</template>

<style scoped>
.job-list-header {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  border-bottom: 1px solid var(--color-border-strong);
  padding: 32px 0;
  width: 100%;
  background-color: var(--color-background-primary);
}

.job-list-header__inner {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: center;
  gap: 15px;
  box-sizing: border-box;
  width: 100%;
  max-width: 1240px;
  margin: 0;
  padding: 0;
}

.job-list-header__content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1 1 0;
  min-width: 0;
  box-sizing: border-box;
  width: 100%;
  padding-bottom: 10px;
}

.job-list-header__title {
  margin: 0;
  font-family: var(--font-family-base);
  font-size: var(--typography-title-1-font-size);
  font-weight: var(--typography-title-1-font-weight-strong);
  line-height: var(--typography-title-1-line-height);
  letter-spacing: var(--typography-title-1-letter-spacing);
  color: var(--color-text-primary);
}

.job-list-header__description {
  margin: 0;
  max-width: 816px;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-tertiary);
}

.job-list-header__actions {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.job-list-header__search {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  max-width: 1240px;
  margin-left: 0;
  margin-right: 0;
  padding: 16px 0 0 0;
}

.job-list-header__search-field {
  flex-shrink: 0;
}
</style>
