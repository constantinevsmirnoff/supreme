/**
 * Port of src/domain/assignJobTemplates.js — keep algorithms in sync.
 */

export function legacyEqualsToArray (legacy: string | null | undefined): string[] {
  if (legacy == null || legacy === '') return []
  return legacy.split(',').map((s) => s.trim()).filter(Boolean)
}

export function normalizeJobTemplates (templates: Record<string, unknown>[]): void {
  for (const t of templates) {
    if (!Array.isArray(t.locationValues)) {
      t.locationValues = legacyEqualsToArray(t.locationEquals as string | null)
    }
    if (!Array.isArray(t.industryValues)) {
      t.industryValues = legacyEqualsToArray(t.industryEquals as string | null)
    }
    if (!Array.isArray(t.companyValues)) {
      t.companyValues = legacyEqualsToArray(t.companyEquals as string | null)
    }
    if (typeof t.conditionsEditedAt !== 'number') {
      t.conditionsEditedAt = 0
    }
    if (typeof t.templateActive !== 'boolean') {
      t.templateActive = true
    }
  }
}

export function getAutoAssignmentNonDefaultTemplates (templates: Record<string, unknown>[]) {
  return templates.filter((t) => !t.isDefault && t.templateActive !== false)
}

function getNonDefaultTemplatesForConditionConflicts (templates: Record<string, unknown>[]) {
  return templates.filter((t) => !t.isDefault)
}

function locationConstraint (t: Record<string, unknown>): string[] {
  return Array.isArray(t.locationValues) && (t.locationValues as string[]).length > 0
    ? (t.locationValues as string[])
    : legacyEqualsToArray(t.locationEquals as string | null)
}

function industryConstraint (t: Record<string, unknown>): string[] {
  return Array.isArray(t.industryValues) && (t.industryValues as string[]).length > 0
    ? (t.industryValues as string[])
    : legacyEqualsToArray(t.industryEquals as string | null)
}

function companyConstraint (t: Record<string, unknown>): string[] {
  return Array.isArray(t.companyValues) && (t.companyValues as string[]).length > 0
    ? (t.companyValues as string[])
    : legacyEqualsToArray(t.companyEquals as string | null)
}

export function jobMatchesTemplate (
  job: { location: string; industry: string; company: string },
  template: Record<string, unknown>
): boolean {
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

export function specificity (template: Record<string, unknown>): number {
  let n = 0
  if (locationConstraint(template).length > 0) n++
  if (industryConstraint(template).length > 0) n++
  if (companyConstraint(template).length > 0) n++
  return n
}

export function singleConstrainedDimension (
  template: Record<string, unknown>
): 'location' | 'industry' | 'company' | null {
  const hasL = locationConstraint(template).length > 0
  const hasI = industryConstraint(template).length > 0
  const hasC = companyConstraint(template).length > 0
  const n = (hasL ? 1 : 0) + (hasI ? 1 : 0) + (hasC ? 1 : 0)
  if (n !== 1) return null
  if (hasL) return 'location'
  if (hasI) return 'industry'
  return 'company'
}

export function pickWinnerForJob (
  pool: Record<string, unknown>[],
  orderedNonDefault: Record<string, unknown>[]
): Record<string, unknown> | null {
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
  const idSet = new Set(candidates.map((t) => t.id as string))
  const byOrder = orderedNonDefault.find((t) => idSet.has(t.id as string))
  return byOrder ?? candidates[0]
}

export function assignTemplatesToJobs (
  jobs: Array<Record<string, unknown>>,
  templates: Record<string, unknown>[],
  manualOverrides: Record<string, string> = {}
): Record<string, number> {
  const defaultTpl = templates.find((t) => t.isDefault)
  if (!defaultTpl) {
    throw new Error('assignTemplatesToJobs: exactly one template must have isDefault: true')
  }

  const nonDefault = getAutoAssignmentNonDefaultTemplates(templates)
  const ordered = [...nonDefault].sort((a, b) => specificity(b) - specificity(a))

  const counts = Object.fromEntries(templates.map((t) => [t.id as string, 0]))
  const titleToId = Object.fromEntries(
    templates.map((t) => [t.title as string, t.id as string])
  )

  for (const job of jobs) {
    const manualTitle = manualOverrides[job.id as string]
    if (manualTitle != null && manualTitle !== '') {
      job.jobTemplate = manualTitle
      const tid = titleToId[manualTitle]
      if (tid) counts[tid] = (counts[tid] ?? 0) + 1
      continue
    }

    const matching = nonDefault.filter((t) =>
      jobMatchesTemplate(
        job as { location: string; industry: string; company: string },
        t
      )
    )
    const winner =
      (pickWinnerForJob(matching, ordered) as Record<string, unknown> | null) ?? defaultTpl
    job.jobTemplate = winner.title
    counts[winner.id as string] = (counts[winner.id as string] ?? 0) + 1
  }

  return counts
}
