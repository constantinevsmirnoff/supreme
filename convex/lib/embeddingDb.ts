import type { MutationCtx } from '../_generated/server'
import type { EmbeddingNamespace } from './embeddingText'

export async function deleteContentEmbeddingRow (
  ctx: MutationCtx,
  namespace: EmbeddingNamespace,
  sourceConvexId: string
): Promise<void> {
  const row = await ctx.db
    .query('contentEmbeddings')
    .withIndex('by_namespace_source', (q) =>
      q.eq('namespace', namespace).eq('sourceConvexId', sourceConvexId)
    )
    .unique()
  if (row) {
    await ctx.db.delete(row._id)
  }
}
