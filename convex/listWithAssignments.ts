import { query } from './_generated/server'
import { v } from 'convex/values'
import {
  assignTemplatesToJobs,
  normalizeJobTemplates
} from './domain/assignJobTemplates'
import {
  filterJobsBySearch,
  filterTemplatesBySearch,
  sortTemplatesDefaultFirst,
  type JobRow,
  type TemplateRow
} from './domain/listFilters'

export const listWithAssignments = query({
  args: {
    manualOverrides: v.optional(v.record(v.string(), v.string())),
    jobFilters: v.optional(
      v.object({
        search: v.optional(v.string())
      })
    ),
    templateFilters: v.optional(
      v.object({
        search: v.optional(v.string())
      })
    )
  },
  handler: async (ctx, args) => {
    const manual = args.manualOverrides ?? {}

    const jobDocs = await ctx.db.query('jobs').collect()
    const templateDocs = await ctx.db.query('jobTemplates').collect()

    if (jobDocs.length === 0 || templateDocs.length === 0) {
      return {
        jobs: [] as JobRow[],
        jobsFiltered: [] as JobRow[],
        templates: [] as TemplateRow[],
        templatesFiltered: [] as TemplateRow[],
        templateCounts: {} as Record<string, number>
      }
    }

    const templates: Record<string, unknown>[] = templateDocs.map((d) => ({
      id: d.externalId,
      title: d.title,
      thumbnail: d.thumbnail,
      isDefault: d.isDefault,
      locationEquals: d.locationEquals,
      industryEquals: d.industryEquals,
      companyEquals: d.companyEquals,
      locationValues: d.locationValues,
      industryValues: d.industryValues,
      companyValues: d.companyValues,
      conditionsEditedAt: d.conditionsEditedAt,
      templateActive: d.templateActive
    }))

    normalizeJobTemplates(templates)

    const templateRows: TemplateRow[] = templates.map((t) => ({
      id: t.id as string,
      title: t.title as string,
      thumbnail: (t.thumbnail as string) ?? '',
      isDefault: t.isDefault as boolean | undefined,
      templateActive: t.templateActive as boolean | undefined,
      locationEquals: t.locationEquals as string | null,
      industryEquals: t.industryEquals as string | null,
      companyEquals: t.companyEquals as string | null,
      locationValues: (t.locationValues as string[]) ?? [],
      industryValues: (t.industryValues as string[]) ?? [],
      companyValues: (t.companyValues as string[]) ?? [],
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

    const counts = assignTemplatesToJobs(jobs, templates, manual)

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

    const jobsFiltered = filterJobsBySearch(
      jobsFull,
      args.jobFilters?.search
    )

    const templatesFiltered = sortTemplatesDefaultFirst(
      filterTemplatesBySearch(templateRows, args.templateFilters?.search)
    )

    return {
      jobs: jobsFull,
      jobsFiltered,
      templates: templateRows,
      templatesFiltered,
      templateCounts: counts
    }
  }
})
