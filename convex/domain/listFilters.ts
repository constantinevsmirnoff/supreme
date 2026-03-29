/**
 * Server-side job / template list filtering — mirrors JobList.vue and PageManager.vue
 * substring semantics (trim, lowercase, includes).
 */

export type JobRow = {
  id: string
  jobTitle: string
  location: string
  industry: string
  company: string
  jobTemplate: string
  active: boolean
  lastUpdated: string
}

export type TemplateRow = {
  id: string
  title: string
  thumbnail: string
  isDefault?: boolean
  templateActive?: boolean
  locationEquals: string | null
  industryEquals: string | null
  companyEquals: string | null
  locationValues: string[]
  industryValues: string[]
  companyValues: string[]
  conditionsEditedAt?: number
}

function conditionLabel (
  value: string | null,
  dimension: 'location' | 'industry' | 'company'
): string {
  if (value != null && value !== '') return value
  return dimension === 'location'
    ? 'Any location'
    : dimension === 'industry'
      ? 'Any industry'
      : 'Any company'
}

function searchBlobForDimension (
  values: string[],
  dimension: 'location' | 'industry' | 'company'
): string {
  return values.length > 0 ? values.join(' ') : conditionLabel(null, dimension)
}

/** True if job matches search (empty search = all). */
export function jobMatchesJobListSearch (job: JobRow, searchRaw: string | undefined): boolean {
  const q = (searchRaw ?? '').trim().toLowerCase()
  if (q === '') return true
  return [job.jobTitle, job.company, job.location, job.industry].some((f) =>
    (f ?? '').toLowerCase().includes(q)
  )
}

export function filterJobsBySearch (
  jobs: JobRow[],
  searchRaw: string | undefined
): JobRow[] {
  const q = (searchRaw ?? '').trim().toLowerCase()
  if (q === '') return jobs
  return jobs.filter((job) => jobMatchesJobListSearch(job, q))
}

/** True if template matches Page Manager search (empty = all). */
export function templateMatchesPageManagerSearch (
  t: TemplateRow,
  searchRaw: string | undefined
): boolean {
  const q = (searchRaw ?? '').trim().toLowerCase()
  if (q === '') return true
  const hay = [
    t.title,
    searchBlobForDimension(t.locationValues, 'location'),
    searchBlobForDimension(t.industryValues, 'industry'),
    searchBlobForDimension(t.companyValues, 'company')
  ]
    .join(' ')
    .toLowerCase()
  return hay.includes(q)
}

export function filterTemplatesBySearch (
  templates: TemplateRow[],
  searchRaw: string | undefined
): TemplateRow[] {
  const q = (searchRaw ?? '').trim().toLowerCase()
  if (q === '') return templates
  return templates.filter((t) => templateMatchesPageManagerSearch(t, q))
}

/** Same ordering as PageManager filteredTemplates computed. */
export function sortTemplatesDefaultFirst<T extends { isDefault?: boolean }> (templates: T[]): T[] {
  return [...templates].sort(
    (a, b) => Number(!!b.isDefault) - Number(!!a.isDefault)
  )
}
