import { ConvexError, v } from 'convex/values'
import { internal } from './_generated/api'
import { mutation } from './_generated/server'
import { deleteContentEmbeddingRow } from './lib/embeddingDb'
import {
  normalizeJobTemplates,
  templatesHaveSameAssignmentConditions
} from './domain/assignJobTemplates'
import { loadAssignmentActiveAttributes } from './domain/assignmentSettings'

const THUMBNAIL_MAX_BYTES = 2 * 1024 * 1024
const ALLOWED_THUMBNAIL_TYPES = new Set(['image/jpeg', 'image/png'])

function nextUntitledTitle (titles: Set<string>): string {
  if (!titles.has('Untitled')) return 'Untitled'
  let n = 2
  while (titles.has(`Untitled (${n})`)) n++
  return `Untitled (${n})`
}

/**
 * Copy a non-default template: inactive, no conditions (Page Manager “Duplicate”).
 * Preserves title prefix `New …` and thumbnail from the source row.
 */
export const duplicateByExternalId = mutation({
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
      throw new ConvexError('Cannot duplicate the default template')
    }
    const all = await ctx.db.query('jobTemplates').collect()
    const titles = new Set(all.map((d) => d.title))
    const baseTitle = `New ${doc.title}`
    let title = baseTitle
    if (titles.has(title)) {
      let n = 2
      while (titles.has(`${baseTitle} (${n})`)) n++
      title = `${baseTitle} (${n})`
    }
    const newExternalId = `tpl-dup-${Date.now()}`
    let thumbLegacy = doc.thumbnail ?? ''
    if (doc.thumbnailStorageId) {
      const u = await ctx.storage.getUrl(doc.thumbnailStorageId)
      if (u) thumbLegacy = u
    }
    const newId = await ctx.db.insert('jobTemplates', {
      externalId: newExternalId,
      title,
      thumbnail: thumbLegacy,
      thumbnailFileName: doc.thumbnailFileName,
      isDefault: false,
      locationEquals: null,
      industryEquals: null,
      companyEquals: null,
      locationValues: [],
      industryValues: [],
      companyValues: [],
      titleValues: [],
      conditionsEditedAt: Date.now(),
      templateActive: false
    })
    await ctx.scheduler.runAfter(0, internal.embeddings.embedSource, {
      namespace: 'jobTemplate',
      sourceConvexId: String(newId)
    })
    return newExternalId
  }
})

/** Blank non-default template: inactive, no conditions. */
export const createUntitled = mutation({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query('jobTemplates').collect()
    const titles = new Set(docs.map((d) => d.title))
    const title = nextUntitledTitle(titles)
    const externalId = `tpl-new-${Date.now()}`
    const newId = await ctx.db.insert('jobTemplates', {
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
      titleValues: [],
      conditionsEditedAt: Date.now(),
      templateActive: false
    })
    await ctx.scheduler.runAfter(0, internal.embeddings.embedSource, {
      namespace: 'jobTemplate',
      sourceConvexId: String(newId)
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
    if (templateActive) {
      const activeAttributes = await loadAssignmentActiveAttributes(ctx)
      const allDocs = await ctx.db.query('jobTemplates').collect()
      const templateRows: Record<string, unknown>[] = allDocs.map((row) => ({
        id: row.externalId,
        title: row.title,
        isDefault: row.isDefault,
        templateActive: row.templateActive,
        locationEquals: row.locationEquals,
        industryEquals: row.industryEquals,
        companyEquals: row.companyEquals,
        locationValues: row.locationValues,
        industryValues: row.industryValues,
        companyValues: row.companyValues,
        titleValues: row.titleValues
      }))
      normalizeJobTemplates(templateRows)
      const nextTemplate = templateRows.find((t) => t.id === externalId)
      if (nextTemplate == null) {
        throw new ConvexError('Template not found')
      }
      const conflicting = templateRows.find((t) => {
        if (t.id === externalId) return false
        if (t.isDefault) return false
        if (t.templateActive === false) return false
        return templatesHaveSameAssignmentConditions(
          nextTemplate,
          t,
          activeAttributes
        )
      })
      if (conflicting != null) {
        throw new ConvexError({
          code: 'DUPLICATE_ASSIGNMENT_CONDITIONS',
          message:
            'This template has the same active assignment conditions as another active template.',
          conflictingTemplateId: String(conflicting.id),
          conflictingTemplateTitle: String(conflicting.title)
        })
      }
    }
    await ctx.db.patch(doc._id, { templateActive })
    await ctx.scheduler.runAfter(0, internal.embeddings.embedSource, {
      namespace: 'jobTemplate',
      sourceConvexId: String(doc._id)
    })
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
    const oldTitle = doc.title
    await ctx.db.patch(doc._id, { title: trimmed })
    await ctx.scheduler.runAfter(0, internal.embeddings.embedSource, {
      namespace: 'jobTemplate',
      sourceConvexId: String(doc._id)
    })
    if (oldTitle === trimmed) return
    const jobDocs = await ctx.db.query('jobs').collect()
    for (const job of jobDocs) {
      if (job.manualJobTemplate === oldTitle) {
        await ctx.db.patch(job._id, { manualJobTemplate: trimmed })
        await ctx.scheduler.runAfter(0, internal.embeddings.embedSource, {
          namespace: 'job',
          sourceConvexId: String(job._id)
        })
      }
    }
  }
})

/** Convex file upload URL for template thumbnail (client POSTs the file, then `finalizeThumbnailUpload`). */
export const generateThumbnailUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  }
})

function validateThumbnailMetadata (contentType: string | undefined, size: number | undefined) {
  if (contentType == null || !ALLOWED_THUMBNAIL_TYPES.has(contentType)) {
    throw new ConvexError('Thumbnail must be a JPEG or PNG image')
  }
  if (size == null || size > THUMBNAIL_MAX_BYTES) {
    throw new ConvexError('Thumbnail must be at most 2 MB')
  }
}

/** Attach uploaded blob to template after client POST; validates type/size and replaces prior storage. */
export const finalizeThumbnailUpload = mutation({
  args: {
    externalId: v.string(),
    storageId: v.id('_storage'),
    fileName: v.string()
  },
  handler: async (ctx, { externalId, storageId, fileName }) => {
    const doc = await ctx.db
      .query('jobTemplates')
      .withIndex('by_externalId', (q) => q.eq('externalId', externalId))
      .unique()
    if (!doc) {
      throw new ConvexError('Template not found')
    }
    const meta = await ctx.storage.getMetadata(storageId)
    try {
      validateThumbnailMetadata(
        meta?.contentType ?? undefined,
        meta?.size ?? undefined
      )
    } catch (e) {
      await ctx.storage.delete(storageId)
      throw e
    }
    const trimmedName = fileName.trim()
    if (trimmedName === '') {
      await ctx.storage.delete(storageId)
      throw new ConvexError('File name cannot be empty')
    }
    if (doc.thumbnailStorageId && doc.thumbnailStorageId !== storageId) {
      await ctx.storage.delete(doc.thumbnailStorageId)
    }
    await ctx.db.patch(doc._id, {
      thumbnailStorageId: storageId,
      thumbnailFileName: trimmedName,
      thumbnail: ''
    })
    await ctx.scheduler.runAfter(0, internal.embeddings.embedSource, {
      namespace: 'jobTemplate',
      sourceConvexId: String(doc._id)
    })
  }
})

/** Remove stored thumbnail and clear filenames. */
export const clearThumbnailByExternalId = mutation({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    const doc = await ctx.db
      .query('jobTemplates')
      .withIndex('by_externalId', (q) => q.eq('externalId', externalId))
      .unique()
    if (!doc) {
      throw new ConvexError('Template not found')
    }
    if (doc.thumbnailStorageId) {
      await ctx.storage.delete(doc.thumbnailStorageId)
    }
    await ctx.db.patch(doc._id, {
      thumbnailStorageId: undefined,
      thumbnailFileName: undefined,
      thumbnail: ''
    })
    await ctx.scheduler.runAfter(0, internal.embeddings.embedSource, {
      namespace: 'jobTemplate',
      sourceConvexId: String(doc._id)
    })
  }
})

/** Update location/industry/company/title condition arrays (and legacy *Equals fields). */
export const patchConditionsByExternalId = mutation({
  args: {
    externalId: v.string(),
    locationValues: v.array(v.string()),
    industryValues: v.array(v.string()),
    companyValues: v.array(v.string()),
    titleValues: v.array(v.string())
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
      titleValues: args.titleValues,
      locationEquals,
      industryEquals,
      companyEquals,
      conditionsEditedAt: Date.now()
    })
    await ctx.scheduler.runAfter(0, internal.embeddings.embedSource, {
      namespace: 'jobTemplate',
      sourceConvexId: String(doc._id)
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
    const deletedTitle = doc.title
    if (doc.thumbnailStorageId) {
      await ctx.storage.delete(doc.thumbnailStorageId)
    }
    await deleteContentEmbeddingRow(ctx, 'jobTemplate', String(doc._id))
    await ctx.db.delete(doc._id)
    const jobDocs = await ctx.db.query('jobs').collect()
    for (const job of jobDocs) {
      if (job.manualJobTemplate === deletedTitle) {
        await ctx.db.patch(job._id, { manualJobTemplate: undefined })
        await ctx.scheduler.runAfter(0, internal.embeddings.embedSource, {
          namespace: 'job',
          sourceConvexId: String(job._id)
        })
      }
    }
  }
})
