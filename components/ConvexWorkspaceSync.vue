<script setup>
/**
 * Keeps jobs / templates / counts in sync with Convex `listWithAssignments`
 * (server-side assignment + jobFilters + templateFilters).
 */
import { watch } from 'vue'
import { useConvexBackend } from '@/src/config/dataBackend.js'
import { getConvexClient, api } from '@/src/lib/convexClient.js'
import {
  manualOverrideByJobId,
  jobs,
  templates,
  templateCounts,
  jobsListView,
  templatesGridView,
  jobListSearchDebounced,
  pageManagerSearchDebounced,
  convexBootstrapReady,
  convexPullNonce
} from '@/src/state/jobsAndTemplatesStore.js'

async function pull () {
  if (!useConvexBackend()) return
  const client = getConvexClient()
  if (!client || !convexBootstrapReady.value) return
  const r = await client.query(api.listWithAssignments.listWithAssignments, {
    manualOverrides: { ...manualOverrideByJobId.value },
    jobFilters: { search: jobListSearchDebounced.value },
    templateFilters: { search: pageManagerSearchDebounced.value }
  })
  jobs.value = r.jobs
  templates.value = r.templates
  templateCounts.value = r.templateCounts
  jobsListView.value = r.jobsFiltered
  templatesGridView.value = r.templatesFiltered
}

watch(
  [
    manualOverrideByJobId,
    jobListSearchDebounced,
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
