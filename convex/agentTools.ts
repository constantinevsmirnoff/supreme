import { internalQuery } from './_generated/server'
import { v } from 'convex/values'
import {
  assignTemplatesToJobs,
  normalizeJobTemplates
} from './domain/assignJobTemplates'
import { loadAssignmentActiveAttributes } from './domain/assignmentSettings'
import type { JobRow, TemplateRow, CustomPageRow, CustomFolderRow } from './domain/listFilters'
import {
  filterJobsByFacets,
  filterJobsBySearch,
  filterTemplatesBySearch,
  filterCustomPagesBySearch,
  filterCustomFoldersBySearch,
  sortCustomFoldersByTitle,
  sortCustomPagesHomeFirst,
  sortTemplatesDefaultFirst,
  type JobListFacetFilters
} from './domain/listFilters'

const MAX_LIMIT = 40

function clampLimit (n: number | undefined): number {
  const x = n ?? 20
  return Math.min(Math.max(1, x), MAX_LIMIT)
}

async function loadJobRows (ctx: {
  db: import('./_generated/server').QueryCtx['db']
}): Promise<JobRow[]> {
  const jobDocs = await ctx.db.query('jobs').collect()
  const templateDocs = await ctx.db.query('jobTemplates').collect()
  const activeAttributes = await loadAssignmentActiveAttributes(ctx)
  const manual: Record<string, string> = {}
  for (const d of jobDocs) {
    const m = d.manualJobTemplate
    if (m != null && m !== '') manual[d.externalId] = m
  }
  const templates: Record<string, unknown>[] = templateDocs.map((d) => ({
    id: d.externalId,
    title: d.title,
    thumbnail: '',
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
  }))
  normalizeJobTemplates(templates)
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
  assignTemplatesToJobs(jobs, templates, manual, { activeAttributes })
  return jobs.map((j) => ({
    id: j.id as string,
    jobTitle: j.jobTitle as string,
    location: j.location as string,
    industry: j.industry as string,
    company: j.company as string,
    jobTemplate: j.jobTemplate as string,
    active: j.active as boolean,
    lastUpdated: j.lastUpdated as string
  }))
}

async function loadTemplateRows (ctx: {
  db: import('./_generated/server').QueryCtx['db']
}): Promise<TemplateRow[]> {
  const templateDocs = await ctx.db.query('jobTemplates').collect()
  const templates: Record<string, unknown>[] = templateDocs.map((d) => ({
    id: d.externalId,
    title: d.title,
    thumbnail: '',
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
  }))
  normalizeJobTemplates(templates)
  return templates.map((t) => ({
    id: t.id as string,
    title: t.title as string,
    thumbnail: '',
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
}

export const getWorkspaceStats = internalQuery({
  args: {},
  handler: async (ctx) => {
    const jobs = await ctx.db.query('jobs').collect()
    const templates = await ctx.db.query('jobTemplates').collect()
    const pages = await ctx.db.query('customPages').collect()
    const folders = await ctx.db.query('customFolders').collect()
    const embeddings = await ctx.db.query('contentEmbeddings').collect()
    const locs = new Set(jobs.map((j) => j.location))
    const inds = new Set(jobs.map((j) => j.industry))
    return {
      jobCount: jobs.length,
      templateCount: templates.length,
      customPageCount: pages.length,
      customFolderCount: folders.length,
      embeddingRowCount: embeddings.length,
      sampleLocations: [...locs].slice(0, 8),
      sampleIndustries: [...inds].slice(0, 8),
      sampleTemplateTitles: templates.map((t) => t.title).slice(0, 12)
    }
  }
})

export const searchJobs = internalQuery({
  args: {
    search: v.optional(v.string()),
    locations: v.optional(v.array(v.string())),
    industries: v.optional(v.array(v.string())),
    companies: v.optional(v.array(v.string())),
    templateTitles: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal('active'), v.literal('inactive'))),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const all = await loadJobRows(ctx)
    const facets: JobListFacetFilters = {
      locations: args.locations,
      industries: args.industries,
      companies: args.companies,
      templateTitles: args.templateTitles,
      status: args.status
    }
    let out = filterJobsByFacets(filterJobsBySearch(all, args.search), facets)
    const lim = clampLimit(args.limit)
    out = out.slice(0, lim)
    return out.map((j) => ({
      id: j.id,
      jobTitle: j.jobTitle,
      company: j.company,
      location: j.location,
      industry: j.industry,
      assignedTemplate: j.jobTemplate,
      active: j.active,
      lastUpdated: j.lastUpdated
    }))
  }
})

export const getJobByExternalId = internalQuery({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    const all = await loadJobRows(ctx)
    const j = all.find((x) => x.id === externalId)
    if (!j) return null
    return {
      id: j.id,
      jobTitle: j.jobTitle,
      company: j.company,
      location: j.location,
      industry: j.industry,
      assignedTemplate: j.jobTemplate,
      active: j.active,
      lastUpdated: j.lastUpdated
    }
  }
})

function templateToAgentShape (t: TemplateRow) {
  return {
    id: t.id,
    title: t.title,
    isDefault: t.isDefault ?? false,
    templateActive: t.templateActive !== false,
    locationValues: t.locationValues,
    industryValues: t.industryValues,
    companyValues: t.companyValues,
    titleValues: t.titleValues
  }
}

export const searchTemplates = internalQuery({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const rows = sortTemplatesDefaultFirst(
      filterTemplatesBySearch(await loadTemplateRows(ctx), args.search)
    )
    return rows.slice(0, clampLimit(args.limit)).map(templateToAgentShape)
  }
})

export const getTemplateByExternalId = internalQuery({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    const rows = await loadTemplateRows(ctx)
    const t = rows.find((x) => x.id === externalId)
    return t ? templateToAgentShape(t) : null
  }
})

export const searchCustomPages = internalQuery({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const pageDocs = await ctx.db.query('customPages').collect()
    const rows: CustomPageRow[] = pageDocs.map((d) => ({
      id: d.externalId,
      title: d.title,
      thumbnail: '',
      isHomepage: d.isHomepage,
      parentFolderId: d.parentFolderExternalId ?? null
    }))
    const filtered = sortCustomPagesHomeFirst(
      filterCustomPagesBySearch(rows, args.search)
    )
    return filtered.slice(0, clampLimit(args.limit)).map((p) => ({
      id: p.id,
      title: p.title,
      isHomepage: p.isHomepage,
      parentFolderId: p.parentFolderId
    }))
  }
})

export const searchCustomFolders = internalQuery({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const folderDocs = await ctx.db.query('customFolders').collect()
    const rows: CustomFolderRow[] = folderDocs.map((d) => ({
      id: d.externalId,
      title: d.title,
      parentFolderId: d.parentFolderExternalId
    }))
    const filtered = sortCustomFoldersByTitle(
      filterCustomFoldersBySearch(rows, args.search)
    )
    return filtered.slice(0, clampLimit(args.limit)).map((f) => ({
      id: f.id,
      title: f.title,
      parentFolderId: f.parentFolderId
    }))
  }
})

export const getContentEmbeddingsByIds = internalQuery({
  args: {
    ids: v.array(v.id('contentEmbeddings'))
  },
  handler: async (ctx, { ids }) => {
    const out: Array<{
      namespace: string
      externalId: string
      textPreview: string | undefined
    } | null> = []
    for (const id of ids) {
      const row = await ctx.db.get(id)
      if (!row) {
        out.push(null)
        continue
      }
      out.push({
        namespace: row.namespace,
        externalId: row.externalId,
        textPreview: row.textPreview
      })
    }
    return out
  }
})
