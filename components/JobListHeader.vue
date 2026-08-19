<script setup lang="ts">
/**
 * Job List Header — Figma: Header (node 27:5050)
 * Action row: optional outline + accent `Button` components, 10px gap (styles from `components/ui/Button.vue`).
 */
import { ref, computed } from 'vue'
import Button from '@/components/ui/Button.vue'
import GhostButton from '@/components/ui/GhostButton.vue'
import SearchField from '@/components/ui/SearchField.vue'
import FilterButton from '@/components/ui/FilterButton.vue'
import JobListFilterMenu from '@/components/JobListFilterMenu.vue'
import ConditionValue from '@/components/ui/ConditionValue.vue'
import { jobListFacetFilters } from '@/src/state/jobsAndTemplatesStore.js'

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
    /** Job list only: filter button + facet pills (hidden on Page Manager) */
    showJobListFilters?: boolean
    /** Search cluster layout */
    searchClusterLayout?: 'start' | 'between'
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
    showClearManualOverrides: true,
    showJobListFilters: true,
    searchClusterLayout: 'start'
  }
)

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'clear-manual-overrides': []
  /** Accent / primary button (e.g. “New +” on Page Manager) */
  'primary-action': []
}>()

const filterMenuOpen = ref(false)

const filterCount = computed(() => {
  const f = jobListFacetFilters.value
  return (
    f.locations.length +
    f.industries.length +
    f.companies.length +
    f.templateTitles.length +
    (f.status != null ? 1 : 0)
  )
})

const filterButtonActive = computed(
  () => filterMenuOpen.value || filterCount.value > 0
)

function removeFacetValue (
  key: 'locations' | 'industries' | 'companies' | 'templateTitles',
  value: string
) {
  const cur = jobListFacetFilters.value[key].filter((x) => x !== value)
  jobListFacetFilters.value = { ...jobListFacetFilters.value, [key]: cur }
}

function clearStatusFilter () {
  jobListFacetFilters.value = {
    ...jobListFacetFilters.value,
    status: undefined
  }
}

const statusFilterLabel = computed(() => {
  const s = jobListFacetFilters.value.status
  if (s === 'active') return 'Active'
  if (s === 'inactive') return 'Inactive'
  return ''
})
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
        <slot name="primaryAction">
          <Button variant="accent" @click="emit('primary-action')">
            {{ primaryActionLabel }}
          </Button>
        </slot>
      </div>
    </div>
    <div class="job-list-header__search">
      <div v-if="$slots.aboveSearch" class="job-list-header__above-search">
        <slot name="aboveSearch" />
      </div>
      <div class="job-list-header__search-main">
        <div
          class="job-list-header__search-cluster"
          :class="{
            'job-list-header__search-cluster--between':
              props.searchClusterLayout === 'between'
          }"
        >
          <SearchField
            class="job-list-header__search-field"
            :model-value="props.searchQuery"
            :placeholder="props.searchPlaceholder"
            @update:model-value="emit('update:searchQuery', $event)"
          />
          <JobListFilterMenu v-if="showJobListFilters" v-model:open="filterMenuOpen">
            <FilterButton
              :active="filterButtonActive"
              :filter-count="filterCount"
              aria-label="Filters"
              @click="filterMenuOpen = !filterMenuOpen"
            />
          </JobListFilterMenu>
          <div v-if="showJobListFilters" class="job-list-header__pills">
            <ConditionValue
              v-for="loc in jobListFacetFilters.locations"
              :key="'facet-loc-' + loc"
              :model-value="loc"
              :label="loc"
              @remove="removeFacetValue('locations', loc)"
            />
            <ConditionValue
              v-for="ind in jobListFacetFilters.industries"
              :key="'facet-ind-' + ind"
              :model-value="ind"
              :label="ind"
              @remove="removeFacetValue('industries', ind)"
            />
            <ConditionValue
              v-for="co in jobListFacetFilters.companies"
              :key="'facet-co-' + co"
              :model-value="co"
              :label="co"
              @remove="removeFacetValue('companies', co)"
            />
            <ConditionValue
              v-for="tpl in jobListFacetFilters.templateTitles"
              :key="'facet-tpl-' + tpl"
              :model-value="tpl"
              :label="tpl"
              @remove="removeFacetValue('templateTitles', tpl)"
            />
            <ConditionValue
              v-if="jobListFacetFilters.status != null"
              key="facet-status"
              :model-value="statusFilterLabel"
              :label="statusFilterLabel"
              @remove="clearStatusFilter"
            />
          </div>
          <slot name="searchClusterAppend" />
        </div>
        <GhostButton
          v-if="showClearManualOverrides"
          @click="emit('clear-manual-overrides')"
        />
      </div>
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
  box-sizing: border-box;
  padding: 25px 25px 15px 25px;
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
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-md);
  width: 100%;
  max-width: 1240px;
  margin-left: 0;
  margin-right: 0;
  padding: 16px 0 0 0;
}

.job-list-header__above-search {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  margin-bottom: 25px;
}

.job-list-header__search-main {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
  width: 100%;
  min-width: 0;
}

.job-list-header__search-cluster {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: var(--space-md);
  flex: 1 1 0;
  min-width: 0;
}

.job-list-header__search-cluster--between {
  justify-content: space-between;
}

.job-list-header__search-field {
  flex-shrink: 0;
  min-width: 200px;
  max-width: 350px;
}

.job-list-header__pills {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  flex: 1 1 auto;
  min-width: 0;
}
</style>
