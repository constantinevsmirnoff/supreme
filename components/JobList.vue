<script setup lang="ts">
/**
 * Job List screen — hosts JobListHeader and scrollable list of JobCards.
 * Each job’s `location` from fetchJobs() is a single German city (see `src/api/mockJobData.js` LOCATIONS).
 * Each job’s `company` is one of three employers (see `COMPANIES` in the same file).
 */
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import JobListHeader from '@/components/JobListHeader.vue'
import JobCard from '@/components/JobCard.vue'
import {
  jobs,
  jobsListView,
  templates,
  manualOverrideByJobId,
  jobListSearchDebounced,
  loadJobsAndTemplates,
  setManualTemplateForJob,
  clearManualTemplateForJob,
  clearManualOverrides,
  TEMPLATE_DROPDOWN_AUTO_VALUE
} from '@/src/state/jobsAndTemplatesStore.js'
import { useConvexBackend } from '@/src/config/dataBackend.js'
import { filterJobsBySearch } from '@/src/domain/listFilters.js'

type Job = {
  id: string
  jobTitle: string
  /** Single German city from mock `LOCATIONS` in `src/api/mockJobData.js` */
  location: string
  industry: string
  /** One of the three names in mock `COMPANIES` */
  company: string
  jobTemplate: string
  active: boolean
  lastUpdated: string
}

const searchQuery = ref('')

let jobSearchDebounceTimer: ReturnType<typeof setTimeout> | undefined
watch(searchQuery, (q) => {
  clearTimeout(jobSearchDebounceTimer)
  jobSearchDebounceTimer = setTimeout(() => {
    jobListSearchDebounced.value = q
  }, 280)
})
onBeforeUnmount(() => {
  clearTimeout(jobSearchDebounceTimer)
})

const filteredJobs = computed(() => {
  if (useConvexBackend()) {
    return jobsListView.value as Job[]
  }
  return filterJobsBySearch(jobs.value as Job[], searchQuery.value)
})

const templateOptions = computed(() =>
  (templates.value as { title: string; isDefault?: boolean; templateActive?: boolean }[])
    .filter((t) => t.isDefault || t.templateActive !== false)
    .map((t) => t.title)
)

function onSelectTemplate (jobId: string, title: string) {
  if (title === TEMPLATE_DROPDOWN_AUTO_VALUE) {
    clearManualTemplateForJob(jobId)
    return
  }
  setManualTemplateForJob(jobId, title)
}

const selectedJobIds = ref(new Set<string>())

function setJobSelected (id: string, value: boolean) {
  const next = new Set(selectedJobIds.value)
  if (value) next.add(id)
  else next.delete(id)
  selectedJobIds.value = next
}

function selectAllInFilteredList () {
  selectedJobIds.value = new Set(filteredJobs.value.map((j) => j.id))
}

function deselectAllSelected () {
  selectedJobIds.value = new Set()
}

function isAssignmentLocked (jobId: string) {
  return !(jobId in manualOverrideByJobId.value)
}

onMounted(() => {
  jobListSearchDebounced.value = searchQuery.value
  void loadJobsAndTemplates()
})
</script>

<template>
  <div class="job-list">
    <JobListHeader
      v-model:search-query="searchQuery"
      @clear-manual-overrides="clearManualOverrides"
    />
    <main class="job-list__main">
      <JobCard
        v-for="job in filteredJobs"
        :key="job.id"
        :job="job"
        :selected="selectedJobIds.has(job.id)"
        :assignment-locked="isAssignmentLocked(job.id)"
        :template-options="templateOptions"
        @update:selected="setJobSelected(job.id, $event)"
        @select-all="selectAllInFilteredList"
        @deselect-all="deselectAllSelected"
        @select-template="onSelectTemplate(job.id, $event)"
      />
    </main>
  </div>
</template>

<style scoped>
.job-list {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  background-color: var(--color-background-primary);
  font-family: var(--font-family-base);
}

.job-list__main {
  flex: 1 1 0;
  min-height: 0;
  margin: 0;
  padding: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
}
</style>
