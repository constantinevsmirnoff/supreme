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

export const jobs = ref([])
export const templates = ref([])
export const templateCounts = ref({})
/** @type {import('vue').Ref<Record<string, string>>} */
export const manualOverrideByJobId = ref({})

let loadPromise = null

export function loadJobsAndTemplates () {
  if (!loadPromise) {
    loadPromise = (async () => {
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
 * Enable or disable automatic job assignment for a non-default template (Page Manager API).
 * Inactive templates do not receive auto-assigned jobs until `active` is true.
 * @param {string} templateId
 * @param {boolean} active
 */
export async function setTemplateActive (templateId, active) {
  const t = templates.value.find((x) => x.id === templateId)
  if (!t || t.isDefault) return
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
 * @returns {Promise<string>} new template id
 */
export async function createUntitledJobTemplate () {
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
  t.title = trimmed
  for (const j of jobs.value) {
    if (j.jobTemplate === oldTitle) {
      j.jobTemplate = t.title
    }
  }
  reassignJobs()
  await updateJobTemplate(templateId, { title: trimmed })
}
