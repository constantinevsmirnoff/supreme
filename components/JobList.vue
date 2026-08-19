<script setup lang="ts">
/**
 * Job List screen — hosts JobListHeader and scrollable list of JobCards.
 * Data from Convex `listWithAssignments` (filtered by debounced search).
 */
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import JobListHeader from '@/components/JobListHeader.vue'
import JobCard from '@/components/JobCard.vue'
import {
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
type Job = {
  id: string
  jobTitle: string
  location: string
  industry: string
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

const filteredJobs = computed(() => jobsListView.value as Job[])

const templateOptions = computed(() =>
  (templates.value as { title: string; isDefault?: boolean; templateActive?: boolean }[])
    .filter((t) => t.isDefault || t.templateActive !== false)
    .map((t) => t.title)
)

function onSelectTemplate (jobId: string, title: string) {
  if (title === TEMPLATE_DROPDOWN_AUTO_VALUE) {
    void clearManualTemplateForJob(jobId)
    return
  }
  void setManualTemplateForJob(jobId, title)
}

/** Context menu “Switch template”: apply to all selected jobs if any selected, else the row under the pointer. */
function onSwitchTemplate (contextJobId: string, templateTitle: string) {
  const ids =
    selectedJobIds.value.size > 0
      ? [...selectedJobIds.value]
      : [contextJobId]
  void Promise.all(ids.map((id) => setManualTemplateForJob(id, templateTitle)))
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
      @clear-manual-overrides="() => void clearManualOverrides()"
    />
    <div class="job-list__scroll-shell">
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
          @switch-template="onSwitchTemplate(job.id, $event)"
        />
      </main>
    </div>
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

.job-list__scroll-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
}

.job-list__scroll-shell::before,
.job-list__scroll-shell::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 20px;
  pointer-events: none;
  z-index: 1;
}

.job-list__scroll-shell::before {
  top: 0;
  background: linear-gradient(
    to bottom,
    var(--color-background-primary),
    transparent
  );
}

.job-list__scroll-shell::after {
  bottom: 0;
  background: linear-gradient(
    to top,
    var(--color-background-primary),
    transparent
  );
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
