import { ref, toRaw } from 'vue'
import { fetchJobs } from '@/src/api/jobs.js'
import {
  fetchJobTemplates,
  updateJobTemplate,
  appendJobTemplate,
  removeJobTemplate
} from '@/src/api/jobTemplates.js'
import {
  assignTemplatesToJobs,
  normalizeJobTemplates,
  syncLegacyFieldsFromArrays
} from '@/src/domain/assignJobTemplates.js'
import { useConvexBackend } from '@/src/config/dataBackend.js'
import { getConvexClient, api } from '@/src/lib/convexClient.js'

export const jobs = ref([])
export const templates = ref([])
export const templateCounts = ref({})
/** @type {import('vue').Ref<Record<string, string>>} */
export const manualOverrideByJobId = ref({})

/** Emitted by JobCard template dropdown “Auto”; JobList clears manual override for that job. */
export const TEMPLATE_DROPDOWN_AUTO_VALUE = '__auto_assign__'

/** Debounced job-list search (Convex query `jobFilters.search`). */
export const jobListSearchDebounced = ref('')
/** Debounced Page Manager template search (Convex query `templateFilters.search`). */
export const pageManagerSearchDebounced = ref('')
/** Convex: jobs after `jobFilters` (substring search). Mock: unused. */
export const jobsListView = ref([])
/** Convex: templates after `templateFilters` + default-first sort. Mock: unused. */
export const templatesGridView = ref([])
/** True after `seedIfEmpty` when using Convex. */
export const convexBootstrapReady = ref(false)
/** Bumped after Convex template/job writes so `ConvexWorkspaceSync` re-runs `listWithAssignments`. */
export const convexPullNonce = ref(0)

let loadPromise = null

export function loadJobsAndTemplates () {
  if (!loadPromise) {
    loadPromise = (async () => {
      if (useConvexBackend()) {
        const client = getConvexClient()
        if (client) {
          await client.mutation(api.seed.seedIfEmpty, {})
        }
        convexBootstrapReady.value = true
        return
      }

      const [jobRows, tplsRaw] = await Promise.all([
        fetchJobs(),
        fetchJobTemplates()
      ])
      const tpls = structuredClone(tplsRaw)
      normalizeJobTemplates(tpls)
      const rows = structuredClone(jobRows)
      templateCounts.value = assignTemplatesToJobs(
        rows,
        tpls,
        manualOverrideByJobId.value
      )
      templates.value = tpls
      jobs.value = rows
    })()
  }
  return loadPromise
}

export function reassignJobs () {
  templateCounts.value = assignTemplatesToJobs(
    jobs.value,
    templates.value,
    manualOverrideByJobId.value
  )
}

export function clearManualOverrides () {
  manualOverrideByJobId.value = {}
  reassignJobs()
}

/**
 * @param {string} jobId
 * @param {string} templateTitle
 */
export function setManualTemplateForJob (jobId, templateTitle) {
  manualOverrideByJobId.value = {
    ...manualOverrideByJobId.value,
    [jobId]: templateTitle
  }
  reassignJobs()
}

/**
 * Remove manual template pick so the job uses conditional auto-assignment again.
 * @param {string} jobId
 */
export function clearManualTemplateForJob (jobId) {
  if (!(jobId in manualOverrideByJobId.value)) return
  const next = { ...manualOverrideByJobId.value }
  delete next[jobId]
  manualOverrideByJobId.value = next
  reassignJobs()
}

/**
 * Enable or disable automatic job assignment for a non-default template (Page Manager API).
 * Inactive templates do not receive auto-assigned jobs until `active` is true.
 * @param {string} templateId
 * @param {boolean} active
 */
/**
 * Persist template condition tags from Page Manager overlay; reassigns jobs (mock) or syncs via Convex pull.
 * @param {string} templateId
 * @param {{ locationValues: string[], industryValues: string[], companyValues: string[] }} payload
 */
export async function applyTemplateConditions (templateId, payload) {
  const t = templates.value.find((x) => x.id === templateId)
  if (!t) return

  if (useConvexBackend()) {
    const client = getConvexClient()
    if (!client) return
    await client.mutation(api.jobTemplates.patchConditionsByExternalId, {
      externalId: templateId,
      locationValues: [...payload.locationValues],
      industryValues: [...payload.industryValues],
      companyValues: [...payload.companyValues]
    })
    convexPullNonce.value++
    return
  }

  t.locationValues = [...payload.locationValues]
  t.industryValues = [...payload.industryValues]
  t.companyValues = [...payload.companyValues]
  syncLegacyFieldsFromArrays(t)
  t.conditionsEditedAt = Date.now()
  reassignJobs()
}

export async function setTemplateActive (templateId, active) {
  const t = templates.value.find((x) => x.id === templateId)
  if (!t || t.isDefault) return

  if (useConvexBackend()) {
    const client = getConvexClient()
    if (!client) return
    await client.mutation(api.jobTemplates.setTemplateActiveByExternalId, {
      externalId: templateId,
      templateActive: active
    })
    convexPullNonce.value++
    return
  }

  t.templateActive = active
  reassignJobs()
  await updateJobTemplate(templateId, { templateActive: active })
}

/**
 * Delete a non-default template; reassigns jobs and clears manual overrides for that title.
 * @param {string} templateId
 */
export async function deleteTemplate (templateId) {
  const t = templates.value.find((x) => x.id === templateId)
  if (!t || t.isDefault) return
  const title = t.title

  if (useConvexBackend()) {
    const client = getConvexClient()
    if (!client) return
    await client.mutation(api.jobTemplates.removeByExternalId, {
      externalId: templateId
    })
    const nextOverrides = { ...manualOverrideByJobId.value }
    for (const jobId of Object.keys(nextOverrides)) {
      if (nextOverrides[jobId] === title) {
        delete nextOverrides[jobId]
      }
    }
    manualOverrideByJobId.value = nextOverrides
    convexPullNonce.value++
    return
  }

  const idx = templates.value.findIndex((x) => x.id === templateId)
  templates.value.splice(idx, 1)
  const nextOverrides = { ...manualOverrideByJobId.value }
  for (const jobId of Object.keys(nextOverrides)) {
    if (nextOverrides[jobId] === title) {
      delete nextOverrides[jobId]
    }
  }
  manualOverrideByJobId.value = nextOverrides
  reassignJobs()
  await removeJobTemplate(templateId)
}

/**
 * Clone a non-default template; copy is inactive and titled "New …".
 * @param {string} templateId
 * @returns {Promise<string | null>} new template id or null
 */
function nextUntitledTemplateTitle () {
  const titles = new Set(templates.value.map((t) => t.title))
  if (!titles.has('Untitled')) return 'Untitled'
  let n = 2
  while (titles.has(`Untitled (${n})`)) n++
  return `Untitled (${n})`
}

/**
 * Create a blank non-default template (inactive, no conditions). Persists as an extra template.
 * @returns {Promise<string | null>} new template id, or null if Convex client missing
 */
export async function createUntitledJobTemplate () {
  if (useConvexBackend()) {
    const client = getConvexClient()
    if (!client) return null
    const id = await client.mutation(api.jobTemplates.createUntitled, {})
    convexPullNonce.value++
    return id
  }

  const title = nextUntitledTemplateTitle()
  const tpl = {
    id: `tpl-new-${Date.now()}`,
    title,
    thumbnail: '',
    isDefault: false,
    templateActive: false,
    locationEquals: null,
    industryEquals: null,
    companyEquals: null,
    locationValues: [],
    industryValues: [],
    companyValues: [],
    conditionsEditedAt: Date.now()
  }
  syncLegacyFieldsFromArrays(tpl)
  const defaultIdx = templates.value.findIndex((x) => x.isDefault)
  if (defaultIdx === -1) {
    templates.value.push(tpl)
  } else {
    templates.value.splice(defaultIdx, 0, tpl)
  }
  reassignJobs()
  await appendJobTemplate(tpl)
  return tpl.id
}

export async function duplicateTemplate (templateId) {
  const t = templates.value.find((x) => x.id === templateId)
  if (!t || t.isDefault) return null
  const clone = structuredClone(toRaw(t))
  clone.id = `tpl-dup-${Date.now()}`
  clone.title = `New ${t.title}`
  clone.isDefault = false
  clone.templateActive = false
  clone.conditionsEditedAt = Date.now()
  syncLegacyFieldsFromArrays(clone)
  const defaultIdx = templates.value.findIndex((x) => x.isDefault)
  if (defaultIdx === -1) {
    templates.value.push(clone)
  } else {
    templates.value.splice(defaultIdx, 0, clone)
  }
  reassignJobs()
  await appendJobTemplate(clone)
  return clone.id
}

export async function renameTemplate (templateId, newTitle) {
  const t = templates.value.find((x) => x.id === templateId)
  if (!t) return
  const trimmed = newTitle.trim()
  if (t.title === trimmed) return
  const oldTitle = t.title

  if (useConvexBackend()) {
    const client = getConvexClient()
    if (!client) return
    await client.mutation(api.jobTemplates.renameByExternalId, {
      externalId: templateId,
      title: trimmed
    })
    const nextOverrides = { ...manualOverrideByJobId.value }
    for (const jobId of Object.keys(nextOverrides)) {
      if (nextOverrides[jobId] === oldTitle) {
        nextOverrides[jobId] = trimmed
      }
    }
    manualOverrideByJobId.value = nextOverrides
    convexPullNonce.value++
    return
  }

  t.title = trimmed
  for (const j of jobs.value) {
    if (j.jobTemplate === oldTitle) {
      j.jobTemplate = t.title
    }
  }
  reassignJobs()
  await updateJobTemplate(templateId, { title: trimmed })
}
