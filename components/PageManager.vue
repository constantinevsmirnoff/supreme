<script setup lang="ts">
/**
 * Page Manager screen — Figma: Header (node 58:6145)
 * Template grid + assignment counts; card opens JobTemplateOverlay to edit conditions.
 *
 * Assignment API: non-default templates include `templateActive` (default true after normalize).
 * While `templateActive === false`, jobs are not auto-assigned to that template (they use the
 * default template). Use `setTemplateActive` from `@/src/state/jobsAndTemplatesStore.js` to toggle.
 */
import { ref, computed, onMounted } from 'vue'
import JobListHeader from '@/components/JobListHeader.vue'
import JobTemplateCard from '@/components/JobTemplateCard.vue'
import JobTemplateOverlay from '@/components/JobTemplateOverlay.vue'
import {
  jobs,
  templates,
  templateCounts,
  loadJobsAndTemplates,
  reassignJobs,
  renameTemplate,
  setTemplateActive,
  duplicateTemplate,
  deleteTemplate,
  createUntitledJobTemplate
} from '@/src/state/jobsAndTemplatesStore.js'
import { syncLegacyFieldsFromArrays } from '@/src/domain/assignJobTemplates.js'

type JobTemplate = {
  id: string
  title: string
  thumbnail: string
  isDefault?: boolean
  /** When false, this template is excluded from automatic job assignment until set to true. */
  templateActive?: boolean
  locationEquals: string | null
  industryEquals: string | null
  companyEquals: string | null
  locationValues: string[]
  industryValues: string[]
  companyValues: string[]
  conditionsEditedAt?: number
}

const searchQuery = ref('')
const overlayTemplateId = ref<string | null>(null)

const overlayTemplate = computed(
  () => templates.value.find((t) => t.id === overlayTemplateId.value) ?? null
)

function conditionLabel (value: string | null, dimension: 'location' | 'industry' | 'company') {
  if (value != null && value !== '') return value
  const any =
    dimension === 'location' ? 'Any location' : dimension === 'industry' ? 'Any industry' : 'Any company'
  return any
}

function conditionPillValues (
  values: string[],
  dimension: 'location' | 'industry' | 'company'
) {
  if (values.length > 0) return [...values]
  return [conditionLabel(null, dimension)]
}

function searchBlobForDimension (
  values: string[],
  dimension: 'location' | 'industry' | 'company'
) {
  return values.length > 0 ? values.join(' ') : conditionLabel(null, dimension)
}

const filteredTemplates = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const list =
    q === ''
      ? templates.value
      : templates.value.filter((t) => {
          const hay = [
            t.title,
            searchBlobForDimension(t.locationValues, 'location'),
            searchBlobForDimension(t.industryValues, 'industry'),
            searchBlobForDimension(t.companyValues, 'company')
          ]
            .join(' ')
            .toLowerCase()
          return hay.includes(q)
        })
  return [...list].sort((a, b) => Number(!!b.isDefault) - Number(!!a.isDefault))
})

function openOverlay (id: string) {
  overlayTemplateId.value = id
}

function closeOverlay () {
  overlayTemplateId.value = null
}

function onDeleteTemplate (id: string) {
  void deleteTemplate(id).then(() => {
    if (overlayTemplateId.value === id) closeOverlay()
  })
}

function onNewTemplate () {
  void createUntitledJobTemplate()
}

function onTemplateApply (payload: {
  locationValues: string[]
  industryValues: string[]
  companyValues: string[]
}) {
  const t = overlayTemplate.value
  if (!t) return
  t.locationValues = [...payload.locationValues]
  t.industryValues = [...payload.industryValues]
  t.companyValues = [...payload.companyValues]
  syncLegacyFieldsFromArrays(t)
  t.conditionsEditedAt = Date.now()
  reassignJobs()
}

onMounted(() => {
  void loadJobsAndTemplates()
})
</script>

<template>
  <div class="page-manager">
    <JobListHeader
      v-model:search-query="searchQuery"
      title="Page Manager"
      description="Here you can find all of your custom pages and job templates. Control how your career website is structured by creating pages and managing job templates."
      search-placeholder="Search for titles, companies, job categories, etc."
      :show-secondary-action="false"
      :show-clear-manual-overrides="false"
      primary-action-label="New +"
      @primary-action="onNewTemplate"
    />
    <main class="page-manager__main" aria-label="Page manager content">
      <div class="page-manager__grid">
        <div
          v-for="tpl in filteredTemplates"
          :key="tpl.id"
          class="page-manager__grid-cell"
        >
          <JobTemplateCard
            interactive
            :title="tpl.title"
            :thumbnail-src="tpl.thumbnail"
            :is-default="Boolean(tpl.isDefault)"
            :template-active="tpl.templateActive !== false"
            :assignment-active="tpl.isDefault ? undefined : (tpl.templateActive !== false)"
            :jobs-summary="`${templateCounts[tpl.id] ?? 0} jobs assigned`"
            :location-values="conditionPillValues(tpl.locationValues, 'location')"
            :industry-values="conditionPillValues(tpl.industryValues, 'industry')"
            :company-values="conditionPillValues(tpl.companyValues, 'company')"
            @open="openOverlay(tpl.id)"
            @update:title="(v) => renameTemplate(tpl.id, v)"
            @set-template-active="(active) => void setTemplateActive(tpl.id, active)"
            @duplicate="() => void duplicateTemplate(tpl.id)"
            @delete="() => onDeleteTemplate(tpl.id)"
          />
        </div>
      </div>
    </main>

    <JobTemplateOverlay
      v-if="overlayTemplate"
      :key="overlayTemplate.id"
      :template="overlayTemplate"
      :templates="templates"
      :jobs="jobs"
      @close="closeOverlay"
      @cancel="closeOverlay"
      @apply="onTemplateApply"
    />
  </div>
</template>

<style scoped>
.page-manager {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  background-color: var(--color-background-primary);
  font-family: var(--font-family-base);
}

.page-manager__main {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
  padding: 16px 24px 32px;
  box-sizing: border-box;
}

.page-manager__grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
  align-items: stretch;
  max-width: 1200px;
  margin: 0 auto;
}

.page-manager__grid-cell {
  box-sizing: border-box;
  flex: 1 1 calc((100% - 20px) / 3);
  min-width: 0;
  max-width: calc((100% - 20px) / 3);
}
</style>
