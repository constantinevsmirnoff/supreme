import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import {
  ASSIGNMENT_SETTINGS_KEY,
  normalizeAssignmentAttributes
} from './domain/assignmentSettings'

export const get = query({
  args: {},
  handler: async (ctx) => {
    const doc = await ctx.db
      .query('assignmentSettings')
      .withIndex('by_key', (q) => q.eq('key', ASSIGNMENT_SETTINGS_KEY))
      .unique()
    return {
      activeAttributes: normalizeAssignmentAttributes(doc?.activeAttributes ?? [])
    }
  }
})

export const setActiveAttributes = mutation({
  args: {
    activeAttributes: v.array(
      v.union(
        v.literal('location'),
        v.literal('industry'),
        v.literal('company'),
        v.literal('title')
      )
    )
  },
  handler: async (ctx, args) => {
    const activeAttributes = normalizeAssignmentAttributes(args.activeAttributes)
    const doc = await ctx.db
      .query('assignmentSettings')
      .withIndex('by_key', (q) => q.eq('key', ASSIGNMENT_SETTINGS_KEY))
      .unique()
    if (doc == null) {
      await ctx.db.insert('assignmentSettings', {
        key: ASSIGNMENT_SETTINGS_KEY,
        activeAttributes
      })
      return
    }
    await ctx.db.patch(doc._id, { activeAttributes })
  }
})
