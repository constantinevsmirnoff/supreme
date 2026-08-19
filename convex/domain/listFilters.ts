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
  thumbnailFileName?: string
  isDefault?: boolean
  templateActive?: boolean
  locationEquals: string | null
  industryEquals: string | null
  companyEquals: string | null
  locationValues: string[]
  industryValues: string[]
  companyValues: string[]
  titleValues: string[]
  conditionsEditedAt?: number
}

export type CustomFolderRow = {
  id: string
  title: string
  /** null = root */
  parentFolderId: string | null
}

export type CustomPageRow = {
  id: string
  title: string
  thumbnail: string
  isHomepage: boolean
  /** null = root */
  parentFolderId: string | null
}

function conditionLabel (
  value: string | null,
  dimension: 'location' | 'industry' | 'company' | 'title'
): string {
  if (value != null && value !== '') return value
  if (dimension === 'location') return 'Any location'
  if (dimension === 'industry') return 'Any industry'
  if (dimension === 'company') return 'Any company'
  return 'Any job title'
}

function searchBlobForDimension (
  values: string[],
  dimension: 'location' | 'industry' | 'company' | 'title'
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

/** Facet args from `listWithAssignments` jobFilters (all optional). */
export type JobListFacetFilters = {
  locations?: string[]
  industries?: string[]
  companies?: string[]
  templateTitles?: string[]
  status?: 'active' | 'inactive'
}

function norm (s: string): string {
  return (s ?? '').trim()
}

/** Non-empty array → job field must be in set (exact match after trim). */
function inSet (jobVal: string, selected: string[] | undefined): boolean {
  if (selected == null || selected.length === 0) return true
  const j = norm(jobVal)
  return selected.some((x) => norm(x) === j)
}

/**
 * AND-combine facet constraints. Empty/omitted arrays = no constraint for that dimension.
 */
export function filterJobsByFacets (
  jobs: JobRow[],
  facets: JobListFacetFilters | undefined
): JobRow[] {
  if (facets == null) return jobs
  const {
    locations,
    industries,
    companies,
    templateTitles,
    status
  } = facets

  return jobs.filter((job) => {
    if (!inSet(job.location, locations)) return false
    if (!inSet(job.industry, industries)) return false
    if (!inSet(job.company, companies)) return false
    if (!inSet(job.jobTemplate, templateTitles)) return false
    if (status === 'active' && !job.active) return false
    if (status === 'inactive' && job.active) return false
    return true
  })
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
    searchBlobForDimension(t.companyValues, 'company'),
    searchBlobForDimension(t.titleValues, 'title')
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

/** True if custom page matches Page Manager search (empty = all). */
export function customPageMatchesPageManagerSearch (
  p: CustomPageRow,
  searchRaw: string | undefined
): boolean {
  const q = (searchRaw ?? '').trim().toLowerCase()
  if (q === '') return true
  return (p.title ?? '').toLowerCase().includes(q)
}

export function filterCustomPagesBySearch (
  pages: CustomPageRow[],
  searchRaw: string | undefined
): CustomPageRow[] {
  const q = (searchRaw ?? '').trim().toLowerCase()
  if (q === '') return pages
  return pages.filter((p) => customPageMatchesPageManagerSearch(p, q))
}

export function sortCustomPagesHomeFirst (pages: CustomPageRow[]): CustomPageRow[] {
  return [...pages].sort((a, b) => Number(b.isHomepage) - Number(a.isHomepage))
}

export function folderMatchesPageManagerSearch (
  f: CustomFolderRow,
  searchRaw: string | undefined
): boolean {
  const q = (searchRaw ?? '').trim().toLowerCase()
  if (q === '') return true
  return (f.title ?? '').toLowerCase().includes(q)
}

export function filterCustomFoldersBySearch (
  folders: CustomFolderRow[],
  searchRaw: string | undefined
): CustomFolderRow[] {
  const q = (searchRaw ?? '').trim().toLowerCase()
  if (q === '') return folders
  return folders.filter((f) => folderMatchesPageManagerSearch(f, q))
}

export function sortCustomFoldersByTitle (folders: CustomFolderRow[]): CustomFolderRow[] {
  return [...folders].sort((a, b) =>
    (a.title ?? '').localeCompare(b.title ?? '', undefined, { sensitivity: 'base' })
  )
}

/** Same ordering as PageManager filteredTemplates computed. */
export function sortTemplatesDefaultFirst<T extends { isDefault?: boolean }> (templates: T[]): T[] {
  return [...templates].sort(
    (a, b) => Number(!!b.isDefault) - Number(!!a.isDefault)
  )
}
