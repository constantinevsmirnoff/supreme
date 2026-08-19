import { query } from './_generated/server'
import { v } from 'convex/values'
import {
  assignTemplatesToJobs,
  normalizeJobTemplates
} from './domain/assignJobTemplates'

/**
 * Run assignment over arbitrary job/template snapshots (e.g. tests or tooling).
 */
export const preview = query({
  args: {
    jobs: v.array(v.any()),
    templates: v.array(v.any()),
    manualOverrides: v.optional(v.record(v.string(), v.string())),
    activeAttributes: v.optional(
      v.array(
        v.union(
          v.literal('location'),
          v.literal('industry'),
          v.literal('company'),
          v.literal('title')
        )
      )
    )
  },
  handler: async (_ctx, args) => {
    const jobs: Record<string, unknown>[] = JSON.parse(
      JSON.stringify(args.jobs)
    ) as Record<string, unknown>[]
    const templates: Record<string, unknown>[] = JSON.parse(
      JSON.stringify(args.templates)
    ) as Record<string, unknown>[]
    const manual = args.manualOverrides ?? {}

    normalizeJobTemplates(templates)
    const templateCounts = assignTemplatesToJobs(jobs, templates, manual, {
      activeAttributes: args.activeAttributes
    })

    const jobTemplateByJobId: Record<string, string> = {}
    for (const j of jobs) {
      jobTemplateByJobId[j.id as string] = j.jobTemplate as string
    }

    return { templateCounts, jobTemplateByJobId }
  }
})
