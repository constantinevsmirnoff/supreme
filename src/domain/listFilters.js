/**
 * Client-side list filtering — mirrors convex/domain/listFilters.ts and JobList / PageManager.
 */

function conditionLabel (value, dimension) {
  if (value != null && value !== '') return value
  return dimension === 'location'
    ? 'Any location'
    : dimension === 'industry'
      ? 'Any industry'
      : 'Any company'
}

function searchBlobForDimension (values, dimension) {
  return values.length > 0 ? values.join(' ') : conditionLabel(null, dimension)
}

export function filterJobsBySearch (jobs, searchRaw) {
  const q = (searchRaw ?? '').trim().toLowerCase()
  if (q === '') return jobs
  return jobs.filter((job) =>
    [job.jobTitle, job.company, job.location, job.industry].some((f) =>
      (f ?? '').toLowerCase().includes(q)
    )
  )
}

export function filterTemplatesBySearch (templates, searchRaw) {
  const q = (searchRaw ?? '').trim().toLowerCase()
  if (q === '') return templates
  return templates.filter((t) => {
    const hay = [
      t.title,
      searchBlobForDimension(t.locationValues ?? [], 'location'),
      searchBlobForDimension(t.industryValues ?? [], 'industry'),
      searchBlobForDimension(t.companyValues ?? [], 'company')
    ]
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
}

export function sortTemplatesDefaultFirst (templates) {
  return [...templates].sort(
    (a, b) => Number(!!b.isDefault) - Number(!!a.isDefault)
  )
}
