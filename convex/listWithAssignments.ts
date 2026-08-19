import { query } from './_generated/server'
import { v } from 'convex/values'
import {
  assignTemplatesToJobs,
  normalizeJobTemplates
} from './domain/assignJobTemplates'
import { loadAssignmentActiveAttributes } from './domain/assignmentSettings'
import {
  filterJobsBySearch,
  filterJobsByFacets,
  filterTemplatesBySearch,
  filterCustomPagesBySearch,
  filterCustomFoldersBySearch,
  sortTemplatesDefaultFirst,
  sortCustomPagesHomeFirst,
  sortCustomFoldersByTitle,
  type JobRow,
  type JobListFacetFilters,
  type TemplateRow,
  type CustomPageRow,
  type CustomFolderRow
} from './domain/listFilters'

export const listWithAssignments = query({
  args: {
    jobFilters: v.optional(
      v.object({
        search: v.optional(v.string()),
        locations: v.optional(v.array(v.string())),
        industries: v.optional(v.array(v.string())),
        companies: v.optional(v.array(v.string())),
        templateTitles: v.optional(v.array(v.string())),
        status: v.optional(
          v.union(v.literal('active'), v.literal('inactive'))
        )
      })
    ),
    templateFilters: v.optional(
      v.object({
        search: v.optional(v.string())
      })
    )
  },
  handler: async (ctx, args) => {
    const jobDocs = await ctx.db.query('jobs').collect()
    const templateDocs = await ctx.db.query('jobTemplates').collect()
    const pageDocs = await ctx.db.query('customPages').collect()
    const folderDocs = await ctx.db.query('customFolders').collect()
    const activeAttributes = await loadAssignmentActiveAttributes(ctx)

    if (jobDocs.length === 0 || templateDocs.length === 0) {
      return {
        jobs: [] as JobRow[],
        jobsFiltered: [] as JobRow[],
        templates: [] as TemplateRow[],
        templatesFiltered: [] as TemplateRow[],
        templateCounts: {} as Record<string, number>,
        manualOverrides: {} as Record<string, string>,
        assignmentSettings: { activeAttributes },
        customPages: [] as CustomPageRow[],
        customPagesFiltered: [] as CustomPageRow[],
        customFolders: [] as CustomFolderRow[],
        customFoldersFiltered: [] as CustomFolderRow[]
      }
    }

    const manual: Record<string, string> = {}
    for (const d of jobDocs) {
      const m = d.manualJobTemplate
      if (m != null && m !== '') {
        manual[d.externalId] = m
      }
    }

    const templates: Record<string, unknown>[] = await Promise.all(
      templateDocs.map(async (d) => {
        const thumbUrl =
          d.thumbnailStorageId != null
            ? (await ctx.storage.getUrl(d.thumbnailStorageId)) ?? ''
            : (d.thumbnail ?? '')
        return {
          id: d.externalId,
          title: d.title,
          thumbnail: thumbUrl,
          thumbnailFileName: d.thumbnailFileName,
          isDefault: d.isDefault,
          locationEquals: d.locationEquals,
          industryEquals: d.industryEquals,
          companyEquals: d.companyEquals,
          locationValues: d.locationValues,
          industryValues: d.industryValues,
          companyValues: d.companyValues,
          titleValues: d.titleValues,
          conditionsEditedAt: d.conditionsEditedAt,
          templateActive: d.templateActive
        }
      })
    )

    normalizeJobTemplates(templates)

    const templateRows: TemplateRow[] = templates.map((t) => ({
      id: t.id as string,
      title: t.title as string,
      thumbnail: (t.thumbnail as string) ?? '',
      thumbnailFileName: t.thumbnailFileName as string | undefined,
      isDefault: t.isDefault as boolean | undefined,
      templateActive: t.templateActive as boolean | undefined,
      locationEquals: t.locationEquals as string | null,
      industryEquals: t.industryEquals as string | null,
      companyEquals: t.companyEquals as string | null,
      locationValues: (t.locationValues as string[]) ?? [],
      industryValues: (t.industryValues as string[]) ?? [],
      companyValues: (t.companyValues as string[]) ?? [],
      titleValues: (t.titleValues as string[]) ?? [],
      conditionsEditedAt: t.conditionsEditedAt as number | undefined
    }))

    const jobs: Record<string, unknown>[] = jobDocs.map((d) => ({
      id: d.externalId,
      jobTitle: d.jobTitle,
      location: d.location,
      industry: d.industry,
      company: d.company,
      jobTemplate: '',
      active: d.active,
      lastUpdated: d.lastUpdated
    }))

    const counts = assignTemplatesToJobs(jobs, templates, manual, {
      activeAttributes
    })

    const jobsFull: JobRow[] = jobs.map((j) => ({
      id: j.id as string,
      jobTitle: j.jobTitle as string,
      location: j.location as string,
      industry: j.industry as string,
      company: j.company as string,
      jobTemplate: j.jobTemplate as string,
      active: j.active as boolean,
      lastUpdated: j.lastUpdated as string
    }))

    const jf = args.jobFilters
    const facetPayload: JobListFacetFilters | undefined =
      jf == null
        ? undefined
        : {
            locations: jf.locations,
            industries: jf.industries,
            companies: jf.companies,
            templateTitles: jf.templateTitles,
            status: jf.status
          }

    const jobsFiltered = filterJobsByFacets(
      filterJobsBySearch(jobsFull, jf?.search),
      facetPayload
    )

    const templatesFiltered = sortTemplatesDefaultFirst(
      filterTemplatesBySearch(templateRows, args.templateFilters?.search)
    )

    const customPageRows: CustomPageRow[] = await Promise.all(
      pageDocs.map(async (d) => {
        const thumbUrl =
          d.thumbnailStorageId != null
            ? (await ctx.storage.getUrl(d.thumbnailStorageId)) ?? ''
            : (d.thumbnail ?? '')
        return {
          id: d.externalId,
          title: d.title,
          thumbnail: thumbUrl,
          isHomepage: d.isHomepage,
          parentFolderId: d.parentFolderExternalId ?? null
        }
      })
    )

    const customFolderRows: CustomFolderRow[] = folderDocs.map((d) => ({
      id: d.externalId,
      title: d.title,
      parentFolderId: d.parentFolderExternalId
    }))

    const searchQ = args.templateFilters?.search
    const customPagesFiltered = sortCustomPagesHomeFirst(
      filterCustomPagesBySearch(customPageRows, searchQ)
    )
    const customFoldersFiltered = sortCustomFoldersByTitle(
      filterCustomFoldersBySearch(customFolderRows, searchQ)
    )

    return {
      jobs: jobsFull,
      jobsFiltered,
      templates: templateRows,
      templatesFiltered,
      templateCounts: counts,
      manualOverrides: manual,
      assignmentSettings: { activeAttributes },
      customPages: sortCustomPagesHomeFirst(customPageRows),
      customPagesFiltered,
      customFolders: sortCustomFoldersByTitle(customFolderRows),
      customFoldersFiltered
    }
  }
})
