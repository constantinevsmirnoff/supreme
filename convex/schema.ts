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
    lastUpdated: v.string()
  }).index('by_externalId', ['externalId']),

  jobTemplates: defineTable({
    externalId: v.string(),
    title: v.string(),
    thumbnail: v.string(),
    isDefault: v.optional(v.boolean()),
    locationEquals: v.union(v.null(), v.string()),
    industryEquals: v.union(v.null(), v.string()),
    companyEquals: v.union(v.null(), v.string()),
    locationValues: v.optional(v.array(v.string())),
    industryValues: v.optional(v.array(v.string())),
    companyValues: v.optional(v.array(v.string())),
    conditionsEditedAt: v.optional(v.number()),
    templateActive: v.optional(v.boolean())
  }).index('by_externalId', ['externalId'])
})
