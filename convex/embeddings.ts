import {
  internalAction,
  internalMutation,
  internalQuery
} from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import {
  buildEmbeddingText,
  voyageEmbeddingModel,
  type EmbeddingNamespace
} from './lib/embeddingText'
import {
  isVoyageEmbeddingsEnabled,
  voyageEmbedSingle
} from './lib/voyageClient'

const namespaceV = v.union(
  v.literal('job'),
  v.literal('jobTemplate'),
  v.literal('customPage'),
  v.literal('customFolder')
)

async function sha256hex (text: string): Promise<string> {
  const buf = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const loadSourcePayload = internalQuery({
  args: {
    namespace: namespaceV,
    sourceConvexId: v.string()
  },
  handler: async (ctx, { namespace, sourceConvexId }) => {
    switch (namespace) {
      case 'job': {
        const d = await ctx.db.get(sourceConvexId as Id<'jobs'>)
        if (!d) return null
        return {
          externalId: d.externalId,
          text: buildEmbeddingText('job', d)
        }
      }
      case 'jobTemplate': {
        const d = await ctx.db.get(sourceConvexId as Id<'jobTemplates'>)
        if (!d) return null
        return {
          externalId: d.externalId,
          text: buildEmbeddingText('jobTemplate', d)
        }
      }
      case 'customPage': {
        const d = await ctx.db.get(sourceConvexId as Id<'customPages'>)
        if (!d) return null
        return {
          externalId: d.externalId,
          text: buildEmbeddingText('customPage', d)
        }
      }
      case 'customFolder': {
        const d = await ctx.db.get(sourceConvexId as Id<'customFolders'>)
        if (!d) return null
        return {
          externalId: d.externalId,
          text: buildEmbeddingText('customFolder', d)
        }
      }
    }
  }
})

export const getEmbeddingBySource = internalQuery({
  args: {
    namespace: namespaceV,
    sourceConvexId: v.string()
  },
  handler: async (ctx, { namespace, sourceConvexId }) => {
    return await ctx.db
      .query('contentEmbeddings')
      .withIndex('by_namespace_source', (q) =>
        q.eq('namespace', namespace).eq('sourceConvexId', sourceConvexId)
      )
      .unique()
  }
})

export const upsertEmbedding = internalMutation({
  args: {
    namespace: namespaceV,
    sourceConvexId: v.string(),
    externalId: v.string(),
    contentHash: v.string(),
    textPreview: v.string(),
    embedding: v.array(v.float64()),
    voyageModel: v.string()
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('contentEmbeddings')
      .withIndex('by_namespace_source', (q) =>
        q.eq('namespace', args.namespace).eq('sourceConvexId', args.sourceConvexId)
      )
      .unique()
    const row = {
      namespace: args.namespace,
      sourceConvexId: args.sourceConvexId,
      externalId: args.externalId,
      contentHash: args.contentHash,
      textPreview: args.textPreview,
      embedding: args.embedding,
      voyageModel: args.voyageModel
    }
    if (existing) {
      await ctx.db.patch(existing._id, row)
    } else {
      await ctx.db.insert('contentEmbeddings', row)
    }
  }
})

export const deleteEmbeddingBySource = internalMutation({
  args: {
    namespace: namespaceV,
    sourceConvexId: v.string()
  },
  handler: async (ctx, { namespace, sourceConvexId }) => {
    const row = await ctx.db
      .query('contentEmbeddings')
      .withIndex('by_namespace_source', (q) =>
        q.eq('namespace', namespace).eq('sourceConvexId', sourceConvexId)
      )
      .unique()
    if (row) await ctx.db.delete(row._id)
  }
})

export const embedSource = internalAction({
  args: {
    namespace: namespaceV,
    sourceConvexId: v.string()
  },
  handler: async (ctx, { namespace, sourceConvexId }) => {
    if (!isVoyageEmbeddingsEnabled()) {
      return
    }
    const payload = await ctx.runQuery(internal.embeddings.loadSourcePayload, {
      namespace,
      sourceConvexId
    })
    if (!payload) return

    const hash = await sha256hex(payload.text)
    const existing = await ctx.runQuery(internal.embeddings.getEmbeddingBySource, {
      namespace,
      sourceConvexId
    })
    if (existing != null && existing.contentHash === hash) {
      return
    }

    const embedding = await voyageEmbedSingle(payload.text, 'document')
    if (embedding === null) {
      return
    }
    await ctx.runMutation(internal.embeddings.upsertEmbedding, {
      namespace,
      sourceConvexId,
      externalId: payload.externalId,
      contentHash: hash,
      textPreview: payload.text.slice(0, 400),
      embedding,
      voyageModel: voyageEmbeddingModel()
    })
  }
})

export const peekMissingSources = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    const cap = Math.min(Math.max(1, limit), 40)
    const embedded = new Set(
      (await ctx.db.query('contentEmbeddings').collect()).map(
        (e) => `${e.namespace}:${e.sourceConvexId}`
      )
    )
    const out: Array<{
      namespace: EmbeddingNamespace
      sourceConvexId: string
    }> = []

    const pushIfMissing = (
      namespace: EmbeddingNamespace,
      sourceConvexId: string
    ) => {
      if (out.length >= cap) return
      const k = `${namespace}:${sourceConvexId}`
      if (embedded.has(k)) return
      out.push({ namespace, sourceConvexId })
    }

    for (const j of await ctx.db.query('jobs').collect()) {
      pushIfMissing('job', String(j._id))
      if (out.length >= cap) return out
    }
    for (const t of await ctx.db.query('jobTemplates').collect()) {
      pushIfMissing('jobTemplate', String(t._id))
      if (out.length >= cap) return out
    }
    for (const p of await ctx.db.query('customPages').collect()) {
      pushIfMissing('customPage', String(p._id))
      if (out.length >= cap) return out
    }
    for (const f of await ctx.db.query('customFolders').collect()) {
      pushIfMissing('customFolder', String(f._id))
      if (out.length >= cap) return out
    }
    return out
  }
})

export const backfillEmbeddingsStep = internalAction({
  args: {},
  handler: async (ctx) => {
    if (!isVoyageEmbeddingsEnabled()) {
      return
    }
    const batch = await ctx.runQuery(internal.embeddings.peekMissingSources, {
      limit: 25
    })
    for (const item of batch) {
      await ctx.scheduler.runAfter(0, internal.embeddings.embedSource, item)
    }
    if (batch.length > 0) {
      await ctx.scheduler.runAfter(1000, internal.embeddings.backfillEmbeddingsStep, {})
    }
  }
})
