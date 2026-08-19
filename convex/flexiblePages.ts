import { internal } from './_generated/api'
import { mutation } from './_generated/server'
import type { MutationCtx } from './_generated/server'
import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { deleteContentEmbeddingRow } from './lib/embeddingDb'

const parentArg = v.union(v.null(), v.string())

async function getFolderByExternalId (
  ctx: MutationCtx,
  externalId: string
): Promise<Doc<'customFolders'> | null> {
  return await ctx.db
    .query('customFolders')
    .withIndex('by_externalId', (q) => q.eq('externalId', externalId))
    .unique()
}

async function getPageByExternalId (
  ctx: MutationCtx,
  externalId: string
): Promise<Doc<'customPages'> | null> {
  return await ctx.db
    .query('customPages')
    .withIndex('by_externalId', (q) => q.eq('externalId', externalId))
    .unique()
}

async function assertParentFolderExists (
  ctx: MutationCtx,
  parentFolderExternalId: string | null
): Promise<void> {
  if (parentFolderExternalId == null) return
  const p = await getFolderByExternalId(ctx, parentFolderExternalId)
  if (p == null) throw new Error('Parent folder not found')
}

/** All folder externalIds in subtree (including root). */
async function collectSubtreeFolderIds (
  ctx: MutationCtx,
  rootExternalId: string
): Promise<Set<string>> {
  const out = new Set<string>()
  const queue: string[] = [rootExternalId]
  while (queue.length > 0) {
    const id = queue.pop()!
    if (out.has(id)) continue
    out.add(id)
    const children = await ctx.db
      .query('customFolders')
      .withIndex('by_parentFolderExternalId', (q) =>
        q.eq('parentFolderExternalId', id)
      )
      .collect()
    for (const c of children) {
      queue.push(c.externalId)
    }
  }
  return out
}

/** Folders being moved cannot be dropped inside themselves or their descendants. */
async function assertValidFolderMoveTarget (
  ctx: MutationCtx,
  folderExternalIds: string[],
  targetParentFolderExternalId: string | null
): Promise<void> {
  if (targetParentFolderExternalId == null) return
  const forbidden = new Set<string>()
  for (const id of folderExternalIds) {
    const sub = await collectSubtreeFolderIds(ctx, id)
    for (const x of sub) forbidden.add(x)
  }
  if (forbidden.has(targetParentFolderExternalId)) {
    throw new Error('Cannot move a folder into itself or its descendant')
  }
}

export const createFolder = mutation({
  args: {
    title: v.optional(v.string()),
    parentFolderExternalId: parentArg
  },
  handler: async (ctx, args) => {
    const parent = args.parentFolderExternalId ?? null
    await assertParentFolderExists(ctx, parent)
    const externalId = crypto.randomUUID()
    const folderId = await ctx.db.insert('customFolders', {
      externalId,
      title: (args.title ?? 'New folder').trim() || 'New folder',
      parentFolderExternalId: parent
    })
    await ctx.scheduler.runAfter(0, internal.embeddings.embedSource, {
      namespace: 'customFolder',
      sourceConvexId: String(folderId)
    })
    return { externalId }
  }
})

export const createCustomPage = mutation({
  args: {
    title: v.optional(v.string()),
    parentFolderExternalId: parentArg
  },
  handler: async (ctx, args) => {
    const parent = args.parentFolderExternalId ?? null
    await assertParentFolderExists(ctx, parent)
    const externalId = crypto.randomUUID()
    const pageId = await ctx.db.insert('customPages', {
      externalId,
      title: (args.title ?? 'Untitled page').trim() || 'Untitled page',
      thumbnail: '',
      isHomepage: false,
      parentFolderExternalId: parent
    })
    await ctx.scheduler.runAfter(0, internal.embeddings.embedSource, {
      namespace: 'customPage',
      sourceConvexId: String(pageId)
    })
    return { externalId }
  }
})

export const moveCustomPages = mutation({
  args: {
    pageExternalIds: v.array(v.string()),
    targetParentFolderExternalId: parentArg
  },
  handler: async (ctx, args) => {
    const target = args.targetParentFolderExternalId ?? null
    await assertParentFolderExists(ctx, target)
    for (const id of args.pageExternalIds) {
      const doc = await getPageByExternalId(ctx, id)
      if (doc == null) continue
      const patch: {
        parentFolderExternalId: string | null
        isHomepage?: boolean
      } = { parentFolderExternalId: target }
      if (target != null && doc.isHomepage) {
        patch.isHomepage = false
      }
      await ctx.db.patch(doc._id, patch)
      await ctx.scheduler.runAfter(0, internal.embeddings.embedSource, {
        namespace: 'customPage',
        sourceConvexId: String(doc._id)
      })
    }
    return { ok: true }
  }
})

export const moveFolders = mutation({
  args: {
    folderExternalIds: v.array(v.string()),
    targetParentFolderExternalId: parentArg
  },
  handler: async (ctx, args) => {
    const target = args.targetParentFolderExternalId ?? null
    await assertParentFolderExists(ctx, target)
    const unique = [...new Set(args.folderExternalIds)]
    await assertValidFolderMoveTarget(ctx, unique, target)
    for (const id of unique) {
      const doc = await getFolderByExternalId(ctx, id)
      if (doc == null) continue
      if (target != null && target === id) continue
      await ctx.db.patch(doc._id, {
        parentFolderExternalId: target
      })
      await ctx.scheduler.runAfter(0, internal.embeddings.embedSource, {
        namespace: 'customFolder',
        sourceConvexId: String(doc._id)
      })
    }
    return { ok: true }
  }
})

export const renameCustomPageByExternalId = mutation({
  args: {
    externalId: v.string(),
    title: v.string()
  },
  handler: async (ctx, args) => {
    const doc = await getPageByExternalId(ctx, args.externalId)
    if (doc == null) throw new Error('Page not found')
    const title = args.title.trim() || doc.title
    await ctx.db.patch(doc._id, { title })
    await ctx.scheduler.runAfter(0, internal.embeddings.embedSource, {
      namespace: 'customPage',
      sourceConvexId: String(doc._id)
    })
    return { ok: true }
  }
})

export const renameFolderByExternalId = mutation({
  args: {
    externalId: v.string(),
    title: v.string()
  },
  handler: async (ctx, args) => {
    const doc = await getFolderByExternalId(ctx, args.externalId)
    if (doc == null) throw new Error('Folder not found')
    const title = args.title.trim() || doc.title
    await ctx.db.patch(doc._id, { title })
    await ctx.scheduler.runAfter(0, internal.embeddings.embedSource, {
      namespace: 'customFolder',
      sourceConvexId: String(doc._id)
    })
    return { ok: true }
  }
})

export const deleteCustomPages = mutation({
  args: { externalIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    for (const id of new Set(args.externalIds)) {
      const doc = await getPageByExternalId(ctx, id)
      if (doc == null) continue
      await deleteContentEmbeddingRow(ctx, 'customPage', String(doc._id))
      await ctx.db.delete(doc._id)
    }
    return { ok: true }
  }
})

export const deleteCustomFoldersRecursive = mutation({
  args: { externalIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const roots = [...new Set(args.externalIds)]
    const allFolderIds = new Set<string>()
    for (const r of roots) {
      const sub = await collectSubtreeFolderIds(ctx, r)
      for (const x of sub) allFolderIds.add(x)
    }

    const pages = await ctx.db.query('customPages').collect()
    for (const p of pages) {
      const par = p.parentFolderExternalId ?? null
      if (par != null && allFolderIds.has(par)) {
        await deleteContentEmbeddingRow(ctx, 'customPage', String(p._id))
        await ctx.db.delete(p._id)
      }
    }

    const pending = new Set(allFolderIds)
    const allFolderDocs = await ctx.db.query('customFolders').collect()
    while (pending.size > 0) {
      let removed = 0
      for (const f of allFolderDocs) {
        if (!pending.has(f.externalId)) continue
        const hasChildStill = allFolderDocs.some(
          (c) =>
            pending.has(c.externalId) &&
            c.parentFolderExternalId === f.externalId
        )
        if (hasChildStill) continue
        await deleteContentEmbeddingRow(ctx, 'customFolder', String(f._id))
        await ctx.db.delete(f._id)
        pending.delete(f.externalId)
        removed++
      }
      if (removed === 0) break
    }
    return { ok: true }
  }
})
