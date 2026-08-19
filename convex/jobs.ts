import { ConvexError, v } from 'convex/values'
import { internal } from './_generated/api'
import { mutation } from './_generated/server'

/** Persist manual template pick (or clear with null) for a job — survives reloads. */
export const setManualJobTemplateByExternalId = mutation({
  args: {
    externalId: v.string(),
    manualTemplateTitle: v.union(v.string(), v.null())
  },
  handler: async (ctx, { externalId, manualTemplateTitle }) => {
    const doc = await ctx.db
      .query('jobs')
      .withIndex('by_externalId', (q) => q.eq('externalId', externalId))
      .unique()
    if (!doc) {
      throw new ConvexError('Job not found')
    }
    if (manualTemplateTitle === null) {
      await ctx.db.patch(doc._id, { manualJobTemplate: undefined })
    } else {
      await ctx.db.patch(doc._id, { manualJobTemplate: manualTemplateTitle })
    }
    await ctx.scheduler.runAfter(0, internal.embeddings.embedSource, {
      namespace: 'job',
      sourceConvexId: String(doc._id)
    })
  }
})

/** Clear every job’s manual template override (Job List “clear manual” action). */
export const clearAllManualJobTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const jobDocs = await ctx.db.query('jobs').collect()
    for (const j of jobDocs) {
      if (j.manualJobTemplate !== undefined) {
        await ctx.db.patch(j._id, { manualJobTemplate: undefined })
        await ctx.scheduler.runAfter(0, internal.embeddings.embedSource, {
          namespace: 'job',
          sourceConvexId: String(j._id)
        })
      }
    }
  }
})
