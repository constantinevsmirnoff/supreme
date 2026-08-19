/**
 * Job ↔ template assignment and condition-conflict rules (single source of truth for Convex).
 * Keep in sync with any client UX that mirrors this behavior.
 */

import {
  ASSIGNMENT_ATTRIBUTES,
  type AssignmentAttribute,
  normalizeAssignmentAttributes
} from './assignmentSettings'

export type Dim = AssignmentAttribute

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
    if (!Array.isArray(t.titleValues)) {
      t.titleValues = []
    }
    if (typeof t.conditionsEditedAt !== 'number') {
      t.conditionsEditedAt = 0
    }
    if (typeof t.templateActive !== 'boolean') {
      t.templateActive = true
    }
  }
}

export function syncLegacyFieldsFromArrays (t: Record<string, unknown>): void {
  const loc = (t.locationValues as string[]) ?? []
  const ind = (t.industryValues as string[]) ?? []
  const comp = (t.companyValues as string[]) ?? []
  t.locationEquals = loc.length > 0 ? loc.join(', ') : null
  t.industryEquals = ind.length > 0 ? ind.join(', ') : null
  t.companyEquals = comp.length > 0 ? comp.join(', ') : null
}

export function getAutoAssignmentNonDefaultTemplates (
  templates: Record<string, unknown>[]
): Record<string, unknown>[] {
  return templates.filter((t) => !t.isDefault && t.templateActive !== false)
}

function getNonDefaultTemplatesForConditionConflicts (
  templates: Record<string, unknown>[]
): Record<string, unknown>[] {
  return templates.filter((t) => !t.isDefault)
}

/** Prefer array form when present (including `[]` = no constraint). Legacy strings only when arrays are absent. */
function locationConstraint (t: Record<string, unknown>): string[] {
  if (Array.isArray(t.locationValues)) {
    return t.locationValues as string[]
  }
  return legacyEqualsToArray(t.locationEquals as string | null)
}

function industryConstraint (t: Record<string, unknown>): string[] {
  if (Array.isArray(t.industryValues)) {
    return t.industryValues as string[]
  }
  return legacyEqualsToArray(t.industryEquals as string | null)
}

function companyConstraint (t: Record<string, unknown>): string[] {
  if (Array.isArray(t.companyValues)) {
    return t.companyValues as string[]
  }
  return legacyEqualsToArray(t.companyEquals as string | null)
}

function titleConstraint (t: Record<string, unknown>): string[] {
  if (!Array.isArray(t.titleValues)) return []
  return (t.titleValues as string[])
    .map((s) => String(s).trim())
    .filter(Boolean)
}

/**
 * Title dimension (same combinatorics as location/industry/company):
 * - Empty `titleValues` → no constraint (any job title).
 * - Non-empty → job matches iff **the job’s `jobTitle` contains at least one** of the
 *   configured strings (case-insensitive substring). Multiple strings are **OR**, same
 *   idea as “job.location must be one of locationValues”.
 */
function jobTitleMatchesTitleConditions (
  jobTitle: string,
  conditions: string[]
): boolean {
  if (conditions.length === 0) return true
  const haystack = jobTitle.trim().toLowerCase()
  return conditions.some((c) => haystack.includes(c.toLowerCase()))
}

export function jobMatchesTemplate (
  job: {
    location: string
    industry: string
    company: string
    jobTitle?: string
  },
  template: Record<string, unknown>,
  activeAttributes: AssignmentAttribute[] = ASSIGNMENT_ATTRIBUTES
): boolean {
  const active = normalizeAssignmentAttributes(activeAttributes)
  if (active.includes('location')) {
    const locs = locationConstraint(template)
    if (locs.length > 0 && !locs.includes(job.location)) {
      return false
    }
  }
  if (active.includes('industry')) {
    const inds = industryConstraint(template)
    if (inds.length > 0 && !inds.includes(job.industry)) {
      return false
    }
  }
  if (active.includes('company')) {
    const comps = companyConstraint(template)
    if (comps.length > 0 && !comps.includes(job.company)) {
      return false
    }
  }
  if (active.includes('title')) {
    const titles = titleConstraint(template)
    if (titles.length > 0) {
      const jt = job.jobTitle ?? ''
      if (!jobTitleMatchesTitleConditions(jt, titles)) return false
    }
  }
  return true
}

/** Sorted, trimmed tag lists for comparing whether two templates use the same rules. */
function normalizeConditionListForIdentity (values: string[]): string[] {
  return values
    .map((s) => String(s).trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

export function templatesHaveSameAssignmentConditions (
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  activeAttributes: AssignmentAttribute[] = ASSIGNMENT_ATTRIBUTES
): boolean {
  const active = normalizeAssignmentAttributes(activeAttributes)
  const listsEqual = (x: string[], y: string[]) => {
    const nx = normalizeConditionListForIdentity(x)
    const ny = normalizeConditionListForIdentity(y)
    if (nx.length !== ny.length) return false
    return nx.every((v, i) => v === ny[i])
  }
  for (const dim of active) {
    if (dim === 'location') {
      if (!listsEqual(locationConstraint(a), locationConstraint(b))) return false
      continue
    }
    if (dim === 'industry') {
      if (!listsEqual(industryConstraint(a), industryConstraint(b))) return false
      continue
    }
    if (dim === 'company') {
      if (!listsEqual(companyConstraint(a), companyConstraint(b))) return false
      continue
    }
    if (!listsEqual(titleConstraint(a), titleConstraint(b))) return false
  }
  return true
}

function hasConstraintForDim (
  template: Record<string, unknown>,
  dim: Dim
): boolean {
  if (dim === 'location') return locationConstraint(template).length > 0
  if (dim === 'industry') return industryConstraint(template).length > 0
  if (dim === 'company') return companyConstraint(template).length > 0
  return titleConstraint(template).length > 0
}

export function specificity (
  template: Record<string, unknown>,
  activeAttributes: AssignmentAttribute[] = ASSIGNMENT_ATTRIBUTES
): number {
  const active = normalizeAssignmentAttributes(activeAttributes)
  let n = 0
  if (active.includes('location') && locationConstraint(template).length > 0) n++
  if (active.includes('industry') && industryConstraint(template).length > 0) n++
  if (active.includes('company') && companyConstraint(template).length > 0) n++
  if (active.includes('title') && titleConstraint(template).length > 0) n++
  return n
}

export function singleConstrainedDimension (
  template: Record<string, unknown>
): Dim | null {
  const hasL = locationConstraint(template).length > 0
  const hasI = industryConstraint(template).length > 0
  const hasC = companyConstraint(template).length > 0
  const hasT = titleConstraint(template).length > 0
  const n =
    (hasL ? 1 : 0) + (hasI ? 1 : 0) + (hasC ? 1 : 0) + (hasT ? 1 : 0)
  if (n !== 1) return null
  if (hasL) return 'location'
  if (hasI) return 'industry'
  if (hasC) return 'company'
  return 'title'
}

export function pickWinnerForJob (
  pool: Record<string, unknown>[],
  orderedNonDefault: Record<string, unknown>[],
  activeAttributes: AssignmentAttribute[] = ASSIGNMENT_ATTRIBUTES
): Record<string, unknown> | null {
  if (pool.length === 0) return null
  const active = normalizeAssignmentAttributes(activeAttributes)
  const bestSpec = Math.max(...pool.map((t) => specificity(t, active)))
  const candidates = pool.filter((t) => specificity(t, active) === bestSpec)
  if (candidates.length === 1) {
    return candidates[0]
  }

  for (const dim of active) {
    const withDim = candidates.filter((t) => hasConstraintForDim(t, dim))
    if (withDim.length === 1) return withDim[0]
    if (withDim.length > 1 && withDim.length < candidates.length) {
      const subsetIds = new Set(withDim.map((t) => t.id as string))
      const bySubsetOrder = orderedNonDefault.find((t) =>
        subsetIds.has(t.id as string)
      )
      return bySubsetOrder ?? withDim[0]
    }
  }

  const idSet = new Set(candidates.map((t) => t.id as string))
  const byOrder = orderedNonDefault.find((t) => idSet.has(t.id as string))
  return byOrder ?? candidates[0]
}

const DIMENSION_LABEL: Record<Dim, string> = {
  location: 'Location',
  industry: 'Industry',
  company: 'Company',
  title: 'Job title'
}

export function getOrthogonalAmbiguityReport (
  templates: Record<string, unknown>[],
  jobs: Array<{
    id: string
    location: string
    industry: string
    company: string
    jobTitle?: string
  }>
) {
  const defaultTpl = templates.find((t) => t.isDefault)
  if (!defaultTpl) {
    return { jobIds: [] as string[], dimensions: [] as Dim[], jobCount: 0, dimensionLabels: [] as string[] }
  }
  const nonDefault = getNonDefaultTemplatesForConditionConflicts(templates)
  const jobIds: string[] = []
  const dimSet = new Set<Dim>()

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

  const dimensions = [...dimSet].sort() as Dim[]
  return {
    jobIds,
    dimensions,
    jobCount: jobIds.length,
    dimensionLabels: dimensions.map((d) => DIMENSION_LABEL[d])
  }
}

export function getOrthogonalConflictDetailForTemplate (
  appliedTemplateId: string,
  templates: Record<string, unknown>[],
  jobs: Array<{
    id: string
    location: string
    industry: string
    company: string
    jobTitle?: string
  }>
) {
  if (!templates.some((t) => t.isDefault)) return null
  const applied = templates.find((t) => t.id === appliedTemplateId)
  if (!applied) return null

  const nonDefault = getNonDefaultTemplatesForConditionConflicts(templates)
  const rivalMap = new Map<
  string,
  { id: string; title: string; dimension: Dim }
  >()
  const jobIds: string[] = []
  const suggestDimSet = new Set<Dim>()

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
    if (!(allSpec1 && allHaveDim && distinctDims)) continue
    if (!atBest.some((t) => t.id === appliedTemplateId)) continue

    jobIds.push(job.id)
    for (const t of atBest) {
      if (t.id === appliedTemplateId) continue
      const d = singleConstrainedDimension(t)
      if (d) {
        rivalMap.set(t.id as string, {
          id: t.id as string,
          title: String(t.title),
          dimension: d
        })
        suggestDimSet.add(d)
      }
    }
  }

  if (jobIds.length === 0) return null

  const appliedDimension = singleConstrainedDimension(applied)
  const rivals = [...rivalMap.values()].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  )
  const suggestDimensions = [...suggestDimSet].sort() as Dim[]
  return {
    jobIds,
    jobCount: jobIds.length,
    appliedTemplateId,
    appliedTitle: String(applied.title),
    appliedDimension,
    rivals,
    suggestDimensions,
    suggestDimensionLabels: suggestDimensions.map((d) => DIMENSION_LABEL[d])
  }
}

export function getDuplicateSameDimensionOverlapDetail (
  appliedTemplateId: string,
  templates: Record<string, unknown>[],
  jobs: Array<{
    id: string
    location: string
    industry: string
    company: string
    jobTitle?: string
  }>
) {
  const applied = templates.find((t) => t.id === appliedTemplateId)
  if (!applied || applied.isDefault) return null

  if (specificity(applied) !== 1) return null
  const dim = singleConstrainedDimension(applied)
  if (!dim) return null

  const valueSetFor = (t: Record<string, unknown>, d: Dim): Set<string> => {
    if (d === 'location') return new Set(locationConstraint(t))
    if (d === 'industry') return new Set(industryConstraint(t))
    if (d === 'company') return new Set(companyConstraint(t))
    return new Set(titleConstraint(t))
  }

  const setE = valueSetFor(applied, dim)
  if (setE.size === 0) return null

  const others = getAutoAssignmentNonDefaultTemplates(templates).filter(
    (t) => t.id !== appliedTemplateId
  )
  const rivalRows: Array<{
    id: string
    title: string
    dimension: Dim
    overlappingValues: string[]
  }> = []
  for (const o of others) {
    if (specificity(o) !== 1) continue
    if (singleConstrainedDimension(o) !== dim) continue
    const setO = valueSetFor(o, dim)
    const overlappingValues = [...setE].filter((v) => setO.has(v))
    if (overlappingValues.length === 0) continue
    rivalRows.push({
      id: o.id as string,
      title: String(o.title),
      dimension: dim,
      overlappingValues: overlappingValues.sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' })
      )
    })
  }
  if (rivalRows.length === 0) return null

  const affectedJobIdSet = new Set<string>()
  for (const job of jobs) {
    if (!jobMatchesTemplate(job, applied)) continue
    for (const r of rivalRows) {
      const o = templates.find((t) => t.id === r.id)
      if (o && jobMatchesTemplate(job, o)) {
        affectedJobIdSet.add(job.id)
        break
      }
    }
  }

  return {
    kind: 'duplicate' as const,
    appliedTemplateId,
    appliedTitle: String(applied.title),
    appliedDimension: dim,
    rivals: rivalRows,
    jobIds: [...affectedJobIdSet],
    jobCount: affectedJobIdSet.size
  }
}

/**
 * When two or more active non-default templates match the same job at the same specificity,
 * assignment picks a winner by internal order (not orthogonal single-field tie, not duplicate
 * single-dimension overlap). Surfaces multi-field collisions such as two templates both
 * constraining location and company.
 *
 * Also flags when another template has the **identical** condition tags (specificity ≥ 2)
 * even if no job in the list matches both yet—mirroring duplicate single-dimension overlap,
 * which can warn from tag overlap alone.
 */
export function getEqualSpecificityTieDetailForTemplate (
  appliedTemplateId: string,
  templates: Record<string, unknown>[],
  jobs: Array<{
    id: string
    location: string
    industry: string
    company: string
    jobTitle?: string
  }>
) {
  const applied = templates.find((t) => t.id === appliedTemplateId)
  if (!applied || applied.isDefault) return null

  const nonDefault = getAutoAssignmentNonDefaultTemplates(templates)
  const rivalMap = new Map<string, { id: string; title: string }>()
  const jobIdSet = new Set<string>()

  if (specificity(applied) >= 2) {
    for (const o of nonDefault) {
      if (o.id === appliedTemplateId) continue
      if (!templatesHaveSameAssignmentConditions(applied, o)) continue
      rivalMap.set(o.id as string, {
        id: o.id as string,
        title: String(o.title)
      })
    }
  }

  for (const job of jobs) {
    const matching = nonDefault.filter((t) => jobMatchesTemplate(job, t))
    if (matching.length < 2) continue
    const bestSpec = Math.max(...matching.map((t) => specificity(t)))
    const atBest = matching.filter((t) => specificity(t) === bestSpec)
    if (atBest.length < 2) continue
    if (!atBest.some((t) => t.id === appliedTemplateId)) continue

    const dims = atBest.map((t) => singleConstrainedDimension(t))
    const allSpec1 = atBest.every((t) => specificity(t) === 1)
    const allHaveDim = dims.every((d) => d != null)
    const distinctDims = new Set(dims).size === dims.length
    if (allSpec1 && allHaveDim && distinctDims) {
      continue
    }

    jobIdSet.add(job.id)
    for (const t of atBest) {
      if (t.id === appliedTemplateId) continue
      rivalMap.set(t.id as string, {
        id: t.id as string,
        title: String(t.title)
      })
    }
  }

  if (rivalMap.size === 0) return null

  if (jobIdSet.size === 0) {
    for (const job of jobs) {
      if (jobMatchesTemplate(job, applied)) {
        jobIdSet.add(job.id)
      }
    }
  }

  const rivals = [...rivalMap.values()].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  )
  const jobIds = [...jobIdSet]
  return {
    kind: 'equalSpec' as const,
    appliedTemplateId,
    appliedTitle: String(applied.title),
    rivals,
    jobIds,
    jobCount: jobIds.length
  }
}

export type OrthogonalConflictDetail = NonNullable<
ReturnType<typeof getOrthogonalConflictDetailForTemplate>
>
export type DuplicateConflictDetail = NonNullable<
ReturnType<typeof getDuplicateSameDimensionOverlapDetail>
>
export type EqualSpecConflictDetail = NonNullable<
ReturnType<typeof getEqualSpecificityTieDetailForTemplate>
>

export function getTemplateConditionConflictDetail (
  appliedTemplateId: string,
  templates: Record<string, unknown>[],
  jobs: Array<{
    id: string
    location: string
    industry: string
    company: string
    jobTitle?: string
  }>
):
  | ({ kind: 'orthogonal' } & OrthogonalConflictDetail)
  | DuplicateConflictDetail
  | EqualSpecConflictDetail
  | null {
  const orth = getOrthogonalConflictDetailForTemplate(
    appliedTemplateId,
    templates,
    jobs
  )
  if (orth) {
    return { kind: 'orthogonal' as const, ...orth }
  }
  const dup = getDuplicateSameDimensionOverlapDetail(
    appliedTemplateId,
    templates,
    jobs
  )
  if (dup) return dup
  return getEqualSpecificityTieDetailForTemplate(
    appliedTemplateId,
    templates,
    jobs
  )
}

export function ambiguityNoticeParagraphsForDuplicateOverlap (
  detail: DuplicateConflictDetail
): string[] {
  const dimLabel = DIMENSION_LABEL[detail.appliedDimension]
  const p1 =
    `Your ${dimLabel} conditions overlap another active template’s ${dimLabel} conditions. A job that fits both will only get one page template—the app picks the winner automatically, and it may not be the one you expect.`

  const rivalPhrase = detail.rivals
    .map((r) => `“${r.title}” (${dimLabel}: ${r.overlappingValues.join(', ')})`)
    .join('; ')
  const p2 = `Where it overlaps: ${rivalPhrase}. Your template “${detail.appliedTitle}” also filters by ${dimLabel}.`

  const p3 =
    detail.jobCount > 0
      ? `Change the tags or add another condition (for example a second field) so each job clearly maps to one template. ${detail.jobCount === 1 ? 'One job in your list matches' : `${detail.jobCount} jobs in your list match`} both this draft and at least one of those templates.`
      : `Change the tags or add another condition so each job clearly maps to one template. None of your current jobs match both yet, but as soon as one does, assignment will be ambiguous.`

  return [p1, p2, p3]
}

export function ambiguityNoticeParagraphsForAppliedTemplate (
  detail: OrthogonalConflictDetail
): string[] {
  const dimOnly = (d: Dim) => `${DIMENSION_LABEL[d]} only`
  const p1 =
    'Some jobs match more than one active template because each template only checks a different single field—for example Location on one and Company on another. The app cannot pick a fair winner, so those jobs stay on the default page template.'

  let p2: string
  if (detail.rivals.length > 0 && detail.appliedDimension) {
    const rivalPhrase = detail.rivals
      .map((r) => `“${r.title}” (${dimOnly(r.dimension)})`)
      .join(', ')
    p2 = `Other templates in this situation: ${rivalPhrase}. Yours—“${detail.appliedTitle}”—only filters by ${DIMENSION_LABEL[detail.appliedDimension]} right now.`
  } else if (detail.rivals.length > 0) {
    const rivalPhrase = detail.rivals
      .map((r) => `“${r.title}” (${dimOnly(r.dimension)})`)
      .join(', ')
    p2 = `Other templates in this situation: ${rivalPhrase}. Yours—“${detail.appliedTitle}”—is part of the same issue.`
  } else {
    p2 = `Your template “${detail.appliedTitle}” is one of several that each use a single field, so jobs can match more than one at once.`
  }

  let p3: string
  if (detail.suggestDimensionLabels.length > 0) {
    const labels =
      detail.suggestDimensionLabels.length === 1
        ? detail.suggestDimensionLabels[0]
        : detail.suggestDimensionLabels.slice(0, -1).join(', ') +
          ' and ' +
          detail.suggestDimensionLabels[detail.suggestDimensionLabels.length - 1]
    p3 = `To fix it for this template, add conditions on ${labels}, or combine fields so one template clearly wins. ${detail.jobCount} job${detail.jobCount === 1 ? '' : 's'} ${detail.jobCount === 1 ? 'is' : 'are'} affected.`
  } else {
    p3 = `Tighten the rules so each affected job matches only one template. ${detail.jobCount} job${detail.jobCount === 1 ? '' : 's'} ${detail.jobCount === 1 ? 'is' : 'are'} affected.`
  }

  return [p1, p2, p3]
}

export function ambiguityNoticeParagraphsForEqualSpecTie (
  detail: EqualSpecConflictDetail
): string[] {
  const p1 =
    'More than one active template matches some of the same jobs with the same number of conditions (for example two templates that each filter by location and company). The app assigns one winner automatically using a fixed internal order, which may not be the template you expect.'

  const rivalPhrase = detail.rivals.map((r) => `“${r.title}”`).join(', ')
  const p2 = `Other templates tied at the same level of detail: ${rivalPhrase}. Yours—“${detail.appliedTitle}”—is part of the overlap.`

  const p3 =
    detail.jobCount > 0
      ? `Differentiate the rules (tighten tags or add another field) so each job maps to only one template. ${detail.jobCount === 1 ? 'One job in your list matches' : `${detail.jobCount} jobs in your list match`} this draft and at least one of those templates at the same specificity.`
      : `Differentiate the rules so each job maps to only one template. None of your current jobs sit in this tie yet, but as soon as one does, assignment will follow the internal order above.`

  return [p1, p2, p3]
}

export function ambiguityNoticeParagraphsForTemplateConflict (
  detail: NonNullable<ReturnType<typeof getTemplateConditionConflictDetail>>
): string[] {
  if (detail.kind === 'orthogonal') {
    const { kind: _k, ...rest } = detail
    return ambiguityNoticeParagraphsForAppliedTemplate(rest as OrthogonalConflictDetail)
  }
  if (detail.kind === 'duplicate') {
    return ambiguityNoticeParagraphsForDuplicateOverlap(detail)
  }
  return ambiguityNoticeParagraphsForEqualSpecTie(detail)
}

export function assignTemplatesToJobs (
  jobs: Array<Record<string, unknown>>,
  templates: Record<string, unknown>[],
  manualOverrides: Record<string, string> = {},
  options?: { activeAttributes?: AssignmentAttribute[] }
): Record<string, number> {
  const activeAttributes = normalizeAssignmentAttributes(
    options?.activeAttributes ?? ASSIGNMENT_ATTRIBUTES
  )
  const defaultTpl = templates.find((t) => t.isDefault)
  if (!defaultTpl) {
    throw new Error('assignTemplatesToJobs: exactly one template must have isDefault: true')
  }

  const nonDefault = getAutoAssignmentNonDefaultTemplates(templates)
  const ordered = [...nonDefault].sort(
    (a, b) => specificity(b, activeAttributes) - specificity(a, activeAttributes)
  )

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

    const matching =
      activeAttributes.length === 0
        ? []
        : nonDefault.filter((t) =>
            jobMatchesTemplate(
              job as {
                location: string
                industry: string
                company: string
                jobTitle?: string
              },
              t,
              activeAttributes
            )
          )
    const winner =
      (pickWinnerForJob(
        matching,
        ordered,
        activeAttributes
      ) as Record<string, unknown> | null) ?? defaultTpl
    job.jobTemplate = winner.title
    counts[winner.id as string] = (counts[winner.id as string] ?? 0) + 1
  }

  return counts
}
