import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  jobs: defineTable({
    externalId: v.string(),
    jobTitle: v.string(),
    location: v.string(),
    industry: v.string(),
    company: v.string(),
    active: v.boolean(),
    lastUpdated: v.string(),
    /** When set, job uses this template title instead of auto-assignment */
    manualJobTemplate: v.optional(v.string())
  }).index('by_externalId', ['externalId']),

  jobTemplates: defineTable({
    externalId: v.string(),
    title: v.string(),
    /** Legacy URL or empty; prefer `thumbnailStorageId` for new uploads */
    thumbnail: v.string(),
    thumbnailStorageId: v.optional(v.id('_storage')),
    thumbnailFileName: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    locationEquals: v.union(v.null(), v.string()),
    industryEquals: v.union(v.null(), v.string()),
    companyEquals: v.union(v.null(), v.string()),
    locationValues: v.optional(v.array(v.string())),
    industryValues: v.optional(v.array(v.string())),
    companyValues: v.optional(v.array(v.string())),
    /** Substrings; job matches if `jobTitle` contains any (case-insensitive). */
    titleValues: v.optional(v.array(v.string())),
    conditionsEditedAt: v.optional(v.number()),
    templateActive: v.optional(v.boolean())
  }).index('by_externalId', ['externalId']),

  customFolders: defineTable({
    externalId: v.string(),
    title: v.string(),
    /** null = root level */
    parentFolderExternalId: v.union(v.null(), v.string())
  })
    .index('by_externalId', ['externalId'])
    .index('by_parentFolderExternalId', ['parentFolderExternalId']),

  customPages: defineTable({
    externalId: v.string(),
    title: v.string(),
    /** Legacy URL or empty; prefer `thumbnailStorageId` for new uploads */
    thumbnail: v.string(),
    thumbnailStorageId: v.optional(v.id('_storage')),
    isHomepage: v.boolean(),
    /** null = root level */
    parentFolderExternalId: v.optional(v.union(v.null(), v.string()))
  })
    .index('by_externalId', ['externalId'])
    .index('by_parentFolderExternalId', ['parentFolderExternalId']),

  /**
   * One row per source doc for Voyage + Convex vector search (namespace filter).
   * `sourceConvexId` is `String(doc._id)` for the corresponding table row.
   */
  contentEmbeddings: defineTable({
    namespace: v.union(
      v.literal('job'),
      v.literal('jobTemplate'),
      v.literal('customPage'),
      v.literal('customFolder')
    ),
    sourceConvexId: v.string(),
    externalId: v.string(),
    contentHash: v.string(),
    textPreview: v.optional(v.string()),
    embedding: v.array(v.float64()),
    voyageModel: v.string()
  })
    .index('by_namespace_source', ['namespace', 'sourceConvexId'])
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 1024,
      filterFields: ['namespace']
    }),

  assignmentSettings: defineTable({
    key: v.string(),
    activeAttributes: v.array(
      v.union(
        v.literal('location'),
        v.literal('industry'),
        v.literal('company'),
        v.literal('title')
      )
    )
  }).index('by_key', ['key'])
})
