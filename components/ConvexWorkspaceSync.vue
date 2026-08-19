<script setup>
/**
 * Keeps jobs / templates / counts in sync with Convex `listWithAssignments`
 * (server-side assignment + jobFilters + templateFilters).
 */
import { watch } from 'vue'
import { getConvexClient, api } from '@/src/lib/convexClient.js'
import {
  manualOverrideByJobId,
  jobs,
  templates,
  customPages,
  customPagesGridView,
  customFolders,
  customFoldersGridView,
  templateCounts,
  jobsListView,
  templatesGridView,
  jobListSearchDebounced,
  jobListFacetFilters,
  pageManagerSearchDebounced,
  assignmentActiveAttributes,
  convexBootstrapReady,
  convexPullNonce
} from '@/src/state/jobsAndTemplatesStore.js'

function buildJobFiltersPayload () {
  const f = jobListFacetFilters.value
  return {
    search: jobListSearchDebounced.value,
    ...(f.locations.length > 0 ? { locations: [...f.locations] } : {}),
    ...(f.industries.length > 0 ? { industries: [...f.industries] } : {}),
    ...(f.companies.length > 0 ? { companies: [...f.companies] } : {}),
    ...(f.templateTitles.length > 0 ? { templateTitles: [...f.templateTitles] } : {}),
    ...(f.status != null ? { status: f.status } : {})
  }
}

async function pull () {
  const client = getConvexClient()
  if (!client || !convexBootstrapReady.value) return
  const r = await client.query(api.listWithAssignments.listWithAssignments, {
    jobFilters: buildJobFiltersPayload(),
    templateFilters: { search: pageManagerSearchDebounced.value }
  })
  jobs.value = r.jobs
  templates.value = r.templates
  customPages.value = r.customPages ?? []
  customPagesGridView.value = r.customPagesFiltered ?? []
  customFolders.value = r.customFolders ?? []
  customFoldersGridView.value = r.customFoldersFiltered ?? []
  templateCounts.value = r.templateCounts
  jobsListView.value = r.jobsFiltered
  templatesGridView.value = r.templatesFiltered
  manualOverrideByJobId.value = r.manualOverrides ?? {}
  assignmentActiveAttributes.value = r.assignmentSettings?.activeAttributes ?? []
}

watch(
  [
    jobListSearchDebounced,
    jobListFacetFilters,
    pageManagerSearchDebounced,
    convexBootstrapReady,
    convexPullNonce
  ],
  () => {
    void pull()
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <span class="convex-workspace-sync" aria-hidden="true" />
</template>

<style scoped>
.convex-workspace-sync {
  display: none;
}
</style>
