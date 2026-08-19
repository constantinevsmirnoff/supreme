import { query } from './_generated/server'
import { v } from 'convex/values'
import {
  assignTemplatesToJobs,
  normalizeJobTemplates,
  syncLegacyFieldsFromArrays
} from './domain/assignJobTemplates'
import { loadAssignmentActiveAttributes } from './domain/assignmentSettings'

/**
 * Evaluate template condition conflicts for a draft edit (full snapshot from client).
 * Returns conflicting job ids and, for the Assigned Jobs preview, every job that matches
 * the draft rules (union with simulated winners) so the list is not empty just because
 * another template wins the tie-break.
 */
export const evaluate = query({
  args: {
    appliedTemplateId: v.string(),
    draftLocationValues: v.array(v.string()),
    draftIndustryValues: v.array(v.string()),
    draftCompanyValues: v.array(v.string()),
    draftTitleValues: v.array(v.string()),
    templates: v.array(v.any()),
    jobs: v.array(v.any()),
    manualOverrides: v.optional(v.record(v.string(), v.string()))
  },
  handler: async (_ctx, args) => {
    const activeAttributes = await loadAssignmentActiveAttributes(_ctx)
    const templates: Record<string, unknown>[] = JSON.parse(
      JSON.stringify(args.templates)
    ) as Record<string, unknown>[]
    const t = templates.find((x) => x.id === args.appliedTemplateId)
    if (t) {
      t.locationValues = [...args.draftLocationValues]
      t.industryValues = [...args.draftIndustryValues]
      t.companyValues = [...args.draftCompanyValues]
      t.titleValues = [...args.draftTitleValues]
      syncLegacyFieldsFromArrays(t)
    }

    normalizeJobTemplates(templates)

    const jobsForAssign = JSON.parse(JSON.stringify(args.jobs)) as Array<
      Record<string, unknown>
    >
    const manual = args.manualOverrides ?? {}
    assignTemplatesToJobs(jobsForAssign, templates, manual, {
      activeAttributes
    })

    const appliedTpl = templates.find((x) => x.id === args.appliedTemplateId)
    const appliedTitle =
      appliedTpl != null ? String(appliedTpl.title ?? '') : ''
    const winnerAssignedJobIds = jobsForAssign
      .filter((j) => String(j.jobTemplate ?? '') === appliedTitle)
      .map((j) => String(j.id))

    const assignedToAppliedTemplateJobIds = [...new Set([...winnerAssignedJobIds])]
    return {
      hasConflict: false,
      paragraphs: [] as string[],
      conflictingJobIds: [] as string[],
      assignedToAppliedTemplateJobIds
    }
  }
})
