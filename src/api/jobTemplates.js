/**
 * Mock job templates API — rules for auto-assigning job page templates (Page Manager + Job List).
 */


/**
 * @typedef {Object} JobTemplate
 * @property {string} id
 * @property {string} title
 * @property {string} thumbnail - preview URL or empty for placeholder
 * @property {boolean} [isDefault]
 * @property {string | null} locationEquals
 * @property {string | null} industryEquals
 * @property {string | null} companyEquals
 * @property {string[]} [locationValues] - set by normalizeJobTemplates / editor
 * @property {string[]} [industryValues]
 * @property {string[]} [companyValues]
 * @property {number} [conditionsEditedAt] - higher = more recently edited (metadata; not used for assignment)
 * @property {boolean} [templateActive] - false = do not auto-assign jobs to this template until true (default after normalize)
 */

/** @type {JobTemplate[]} */
const JOB_TEMPLATES = [
  {
    id: 'tpl-10',
    title: 'Standard Job Page',
    thumbnail: '',
    isDefault: true,
    locationEquals: null,
    industryEquals: null,
    companyEquals: null,
    conditionsEditedAt: 0
  }
]

const STORAGE_KEY = 'project-supreme-job-template-overrides'
const EXTRAS_KEY = 'project-supreme-job-template-extras'
const REMOVED_BASE_IDS_KEY = 'project-supreme-job-template-removed-ids'

/**
 * @returns {Record<string, { title?: string; templateActive?: boolean }>}
 */
function getOverrides () {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function setOverrides (overrides) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
}

/**
 * @returns {JobTemplate[]}
 */
function getExtras () {
  try {
    const raw = localStorage.getItem(EXTRAS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setExtras (list) {
  localStorage.setItem(EXTRAS_KEY, JSON.stringify(list))
}

/**
 * @returns {Set<string>}
 */
function getRemovedBaseIds () {
  try {
    const raw = localStorage.getItem(REMOVED_BASE_IDS_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function setRemovedBaseIds (set) {
  localStorage.setItem(REMOVED_BASE_IDS_KEY, JSON.stringify([...set]))
}

export function fetchJobTemplates () {
  const removedBase = getRemovedBaseIds()
  const overrides = getOverrides()
  const tpls = structuredClone(JOB_TEMPLATES).filter((t) => !removedBase.has(t.id))
  for (const t of tpls) {
    const o = overrides[t.id]
    if (o?.title != null) t.title = o.title
    if (o && Object.prototype.hasOwnProperty.call(o, 'templateActive')) {
      t.templateActive = o.templateActive
    }
  }
  const extras = getExtras()
  return Promise.resolve([...tpls, ...extras])
}

/**
 * Update a template (persists to storage; mock API).
 * @param {string} templateId
 * @param {{ title?: string; templateActive?: boolean }} payload
 * @returns {Promise<void>}
 */
export function updateJobTemplate (templateId, payload) {
  const overrides = getOverrides()
  const existing = overrides[templateId] ?? {}
  if (payload.title != null) existing.title = payload.title
  if (payload.templateActive !== undefined) {
    existing.templateActive = payload.templateActive
  }
  overrides[templateId] = existing
  setOverrides(overrides)
  return Promise.resolve()
}

/**
 * Persist a user-created template (e.g. duplicate) for reload.
 * @param {JobTemplate} template
 * @returns {Promise<void>}
 */
export function appendJobTemplate (template) {
  const extras = getExtras()
  extras.push(template)
  setExtras(extras)
  return Promise.resolve()
}

/**
 * Remove a template from persistence (extras row or base + overrides).
 * @param {string} templateId
 * @returns {Promise<void>}
 */
export function removeJobTemplate (templateId) {
  const extras = getExtras()
  const xi = extras.findIndex((t) => t.id === templateId)
  if (xi !== -1) {
    extras.splice(xi, 1)
    setExtras(extras)
    return Promise.resolve()
  }
  const removed = getRemovedBaseIds()
  removed.add(templateId)
  setRemovedBaseIds(removed)
  const overrides = getOverrides()
  delete overrides[templateId]
  setOverrides(overrides)
  return Promise.resolve()
}
