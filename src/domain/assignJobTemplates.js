/**
 * Assign each job to a job template by location/industry/company rules.
 * Each dimension: empty list = any; non-empty = job field must be in the set (OR within dimension).
 * Non-default templates with `templateActive === false` are skipped for auto-assignment (jobs fall
 * through to the default template) until the template is active again.
 * Non-default templates win by highest specificity (count of constrained dimensions).
 * Orthogonal ties (same max specificity, each matcher constrains exactly one dimension, all on
 * different axes — e.g. company-only vs location-only): no automatic winner; jobs fall through
 * to the default template. `conditionsEditedAt` is not used for assignment.
 */

/**
 * @param {string | null | undefined} legacy
 * @returns {string[]}
 */
export function legacyEqualsToArray (legacy) {
  if (legacy == null || legacy === '') return []
  return legacy.split(',').map((s) => s.trim()).filter(Boolean)
}

/**
 * Ensure locationValues / industryValues / companyValues exist (mutates template objects).
 * @param {object[]} templates
 */
export function normalizeJobTemplates (templates) {
  for (const t of templates) {
    if (!Array.isArray(t.locationValues)) {
      t.locationValues = legacyEqualsToArray(t.locationEquals)
    }
    if (!Array.isArray(t.industryValues)) {
      t.industryValues = legacyEqualsToArray(t.industryEquals)
    }
    if (!Array.isArray(t.companyValues)) {
      t.companyValues = legacyEqualsToArray(t.companyEquals)
    }
    if (typeof t.conditionsEditedAt !== 'number') {
      t.conditionsEditedAt = 0
    }
    if (typeof t.templateActive !== 'boolean') {
      t.templateActive = true
    }
  }
}

/**
 * Non-default templates that receive automatic job assignment (active only).
 * @param {object[]} templates
 */
export function getAutoAssignmentNonDefaultTemplates (templates) {
  return templates.filter((t) => !t.isDefault && t.templateActive !== false)
}

/**
 * Non-default templates considered when detecting orthogonal rule conflicts in the template editor.
 * Includes `templateActive === false` so conflicts are surfaced before a template is activated.
 */
function getNonDefaultTemplatesForConditionConflicts (templates) {
  return templates.filter((t) => !t.isDefault)
}

/**
 * Keep legacy *Equals fields aligned with arrays for APIs and older readers.
 * @param {object} t
 */
export function syncLegacyFieldsFromArrays (t) {
  t.locationEquals =
    t.locationValues.length > 0 ? t.locationValues.join(', ') : null
  t.industryEquals =
    t.industryValues.length > 0 ? t.industryValues.join(', ') : null
  t.companyEquals =
    t.companyValues.length > 0 ? t.companyValues.join(', ') : null
}

function locationConstraint (t) {
  return Array.isArray(t.locationValues) && t.locationValues.length > 0
    ? t.locationValues
    : legacyEqualsToArray(t.locationEquals)
}

function industryConstraint (t) {
  return Array.isArray(t.industryValues) && t.industryValues.length > 0
    ? t.industryValues
    : legacyEqualsToArray(t.industryEquals)
}

function companyConstraint (t) {
  return Array.isArray(t.companyValues) && t.companyValues.length > 0
    ? t.companyValues
    : legacyEqualsToArray(t.companyEquals)
}

/**
 * @param {{ location: string, industry: string, company: string }} job
 * @param {object} template
 */
export function jobMatchesTemplate (job, template) {
  const locs = locationConstraint(template)
  if (locs.length > 0 && !locs.includes(job.location)) {
    return false
  }
  const inds = industryConstraint(template)
  if (inds.length > 0 && !inds.includes(job.industry)) {
    return false
  }
  const comps = companyConstraint(template)
  if (comps.length > 0 && !comps.includes(job.company)) {
    return false
  }
  return true
}

export function specificity (template) {
  let n = 0
  if (locationConstraint(template).length > 0) n++
  if (industryConstraint(template).length > 0) n++
  if (companyConstraint(template).length > 0) n++
  return n
}

/**
 * @param {object} template
 * @returns {'location' | 'industry' | 'company' | null}
 */
export function singleConstrainedDimension (template) {
  const hasL = locationConstraint(template).length > 0
  const hasI = industryConstraint(template).length > 0
  const hasC = companyConstraint(template).length > 0
  const n = (hasL ? 1 : 0) + (hasI ? 1 : 0) + (hasC ? 1 : 0)
  if (n !== 1) return null
  if (hasL) return 'location'
  if (hasI) return 'industry'
  return 'company'
}

/**
 * @param {object[]} pool - matching non-default templates
 * @param {object[]} orderedNonDefault - declaration order after specificity sort (for tie-break)
 * @returns {object | null} winning template, or null if pool empty or unresolved orthogonal tie
 */
export function pickWinnerForJob (pool, orderedNonDefault) {
  if (pool.length === 0) return null
  const bestSpec = Math.max(...pool.map((t) => specificity(t)))
  const candidates = pool.filter((t) => specificity(t) === bestSpec)
  if (candidates.length === 1) {
    return candidates[0]
  }
  const dims = candidates.map((t) => singleConstrainedDimension(t))
  const allSpec1 = candidates.every((t) => specificity(t) === 1)
  const allHaveDim = dims.every((d) => d != null)
  const distinctDims = new Set(dims).size === dims.length
  const orthogonal = allSpec1 && allHaveDim && distinctDims
  if (orthogonal) {
    return null
  }
  const idSet = new Set(candidates.map((t) => t.id))
  const byOrder = orderedNonDefault.find((t) => idSet.has(t.id))
  return byOrder ?? candidates[0]
}

const DIMENSION_LABEL = {
  location: 'Location',
  industry: 'Industry',
  company: 'Company'
}

/**
 * Jobs that participate in an orthogonal equal-assignment conflict (unresolved without default).
 * Uses all non-default templates, including inactive ones, so the overlay can warn before activation.
 * @param {object[]} templates
 * @param {Array<{ id: string, location: string, industry: string, company: string }>} jobs
 * @returns {{ jobIds: string[], dimensions: ('location'|'industry'|'company')[], jobCount: number }}
 */
export function getOrthogonalAmbiguityReport (templates, jobs) {
  const defaultTpl = templates.find((t) => t.isDefault)
  if (!defaultTpl) {
    return { jobIds: [], dimensions: [], jobCount: 0 }
  }
  const nonDefault = getNonDefaultTemplatesForConditionConflicts(templates)
  const jobIds = []
  const dimSet = new Set()

  for (const job of jobs) {
    const matching = nonDefault.filter((t) => jobMatchesTemplate(job, t))
    if (matching.length < 2) continue
    const bestSpec = Math.max(...matching.map((t) => specificity(t)))
    const atBest = matching.filter((t) => specificity(t) === bestSpec)
    if (atBest.length < 2) continue
    const dims = atBest.map((t) => singleConstrainedDimension(t))
    const allSpec1 = atBest.every((t) => specificity(t) === 1)
    const allHaveDim = dims.every((d) => d != null)
    const distinctDims = new Set(dims).size === dims.length
    if (allSpec1 && allHaveDim && distinctDims) {
      jobIds.push(job.id)
      for (const d of dims) {
        if (d) dimSet.add(d)
      }
    }
  }

  const dimensions = [...dimSet].sort()
  return {
    jobIds,
    dimensions,
    jobCount: jobIds.length,
    dimensionLabels: dimensions.map((d) => DIMENSION_LABEL[d])
  }
}

/**
 * True if applying/saving this template would leave an orthogonal ambiguity that includes it.
 * Considers all non-default templates (including inactive), matching TagInput / overlay validation.
 * @param {string} appliedTemplateId
 * @param {object[]} templates
 * @param {Array<{ id: string, location: string, industry: string, company: string }>} jobs
 */
export function wouldBlockTemplateApply (appliedTemplateId, templates, jobs) {
  if (!templates.some((t) => t.isDefault)) return false
  const nonDefault = getNonDefaultTemplatesForConditionConflicts(templates)
  for (const job of jobs) {
    const matching = nonDefault.filter((t) => jobMatchesTemplate(job, t))
    if (matching.length < 2) continue
    const bestSpec = Math.max(...matching.map((t) => specificity(t)))
    const atBest = matching.filter((t) => specificity(t) === bestSpec)
    if (atBest.length < 2) continue
    const dims = atBest.map((t) => singleConstrainedDimension(t))
    const allSpec1 = atBest.every((t) => specificity(t) === 1)
    const allHaveDim = dims.every((d) => d != null)
    const distinctDims = new Set(dims).size === dims.length
    if (allSpec1 && allHaveDim && distinctDims) {
      if (atBest.some((t) => t.id === appliedTemplateId)) {
        return true
      }
    }
  }
  return false
}

/**
 * @param {Array<{ id: string, jobTemplate: string, location: string, industry: string, company: string }>} jobs - mutated in place
 * @param {Array<object>} templates
 * @param {Record<string, string>} [manualOverrides] - job id -> template title; those jobs skip auto assignment
 * @returns {Record<string, number>} counts by template id
 */
export function assignTemplatesToJobs (jobs, templates, manualOverrides = {}) {
  const defaultTpl = templates.find((t) => t.isDefault)
  if (!defaultTpl) {
    throw new Error('assignTemplatesToJobs: exactly one template must have isDefault: true')
  }

  const nonDefault = getAutoAssignmentNonDefaultTemplates(templates)
  const ordered = [...nonDefault].sort((a, b) => specificity(b) - specificity(a))

  const counts = Object.fromEntries(templates.map((t) => [t.id, 0]))
  const titleToId = Object.fromEntries(templates.map((t) => [t.title, t.id]))

  for (const job of jobs) {
    const manualTitle = manualOverrides[job.id]
    if (manualTitle != null && manualTitle !== '') {
      job.jobTemplate = manualTitle
      const tid = titleToId[manualTitle]
      if (tid) counts[tid] = (counts[tid] ?? 0) + 1
      continue
    }

    const matching = nonDefault.filter((t) => jobMatchesTemplate(job, t))
    const winner = pickWinnerForJob(matching, ordered) ?? defaultTpl
    job.jobTemplate = winner.title
    counts[winner.id] = (counts[winner.id] ?? 0) + 1
  }

  return counts
}

/**
 * Build user-facing paragraphs for overlay conflict notice.
 * @param {ReturnType<typeof getOrthogonalAmbiguityReport>} report
 * @param {string} templateTitle
 */
export function ambiguityNoticeParagraphs (report, templateTitle) {
  const labels =
    report.dimensionLabels.length > 0
      ? report.dimensionLabels.join(', ')
      : 'multiple attributes'
  return [
    'Under current conditions some jobs match two templates that each use a single rule on different attributes (for example one template by company and another by location). Those jobs are assigned to the default template until you add more specific rules so every job maps to one template.',
    `${report.jobCount} job${report.jobCount === 1 ? '' : 's'} are affected when saving conditions for “${templateTitle}”. Attributes involved: ${labels}.`
  ]
}
