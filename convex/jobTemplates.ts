import { ConvexError, v } from 'convex/values'
import { mutation } from './_generated/server'

function nextUntitledTitle (titles: Set<string>): string {
  if (!titles.has('Untitled')) return 'Untitled'
  let n = 2
  while (titles.has(`Untitled (${n})`)) n++
  return `Untitled (${n})`
}

/** Blank non-default template: inactive, no conditions (matches mock `createUntitledJobTemplate`). */
export const createUntitled = mutation({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query('jobTemplates').collect()
    const titles = new Set(docs.map((d) => d.title))
    const title = nextUntitledTitle(titles)
    const externalId = `tpl-new-${Date.now()}`
    await ctx.db.insert('jobTemplates', {
      externalId,
      title,
      thumbnail: '',
      isDefault: false,
      locationEquals: null,
      industryEquals: null,
      companyEquals: null,
      locationValues: [],
      industryValues: [],
      companyValues: [],
      conditionsEditedAt: Date.now(),
      templateActive: false
    })
    return externalId
  }
})

/** Toggle whether a non-default template participates in auto-assignment. */
export const setTemplateActiveByExternalId = mutation({
  args: {
    externalId: v.string(),
    templateActive: v.boolean()
  },
  handler: async (ctx, { externalId, templateActive }) => {
    const doc = await ctx.db
      .query('jobTemplates')
      .withIndex('by_externalId', (q) => q.eq('externalId', externalId))
      .unique()
    if (!doc) {
      throw new ConvexError('Template not found')
    }
    if (doc.isDefault) {
      throw new ConvexError('Cannot change activation on the default template')
    }
    await ctx.db.patch(doc._id, { templateActive })
  }
})

/** Change display title (assignment uses title as the job’s `jobTemplate` label). */
export const renameByExternalId = mutation({
  args: { externalId: v.string(), title: v.string() },
  handler: async (ctx, { externalId, title }) => {
    const doc = await ctx.db
      .query('jobTemplates')
      .withIndex('by_externalId', (q) => q.eq('externalId', externalId))
      .unique()
    if (!doc) {
      throw new ConvexError('Template not found')
    }
    const trimmed = title.trim()
    if (trimmed === '') {
      throw new ConvexError('Title cannot be empty')
    }
    await ctx.db.patch(doc._id, { title: trimmed })
  }
})

/** Update location/industry/company condition arrays (and legacy *Equals fields). */
export const patchConditionsByExternalId = mutation({
  args: {
    externalId: v.string(),
    locationValues: v.array(v.string()),
    industryValues: v.array(v.string()),
    companyValues: v.array(v.string())
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query('jobTemplates')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.externalId))
      .unique()
    if (!doc) {
      throw new ConvexError('Template not found')
    }
    const locationEquals =
      args.locationValues.length > 0 ? args.locationValues.join(', ') : null
    const industryEquals =
      args.industryValues.length > 0 ? args.industryValues.join(', ') : null
    const companyEquals =
      args.companyValues.length > 0 ? args.companyValues.join(', ') : null
    await ctx.db.patch(doc._id, {
      locationValues: args.locationValues,
      industryValues: args.industryValues,
      companyValues: args.companyValues,
      locationEquals,
      industryEquals,
      companyEquals,
      conditionsEditedAt: Date.now()
    })
  }
})

/** Remove a non-default template by `externalId` (same id as client `template.id`). */
export const removeByExternalId = mutation({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    const doc = await ctx.db
      .query('jobTemplates')
      .withIndex('by_externalId', (q) => q.eq('externalId', externalId))
      .unique()
    if (!doc) {
      throw new ConvexError('Template not found')
    }
    if (doc.isDefault) {
      throw new ConvexError('Cannot delete the default template')
    }
    await ctx.db.delete(doc._id)
  }
})
