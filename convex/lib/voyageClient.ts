import { voyageEmbeddingModel } from './embeddingText'

/**
 * When false, skip all Voyage HTTP calls (no embeddings, no payment errors in logs).
 * Set Convex env `VOYAGE_DISABLED=1` to turn off; remove or set to `0` to re-enable.
 */
export function isVoyageEmbeddingsEnabled (): boolean {
  const v = process.env.VOYAGE_DISABLED?.trim().toLowerCase()
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') {
    return false
  }
  return true
}

/**
 * Single-text embedding via Voyage (1024-dim for voyage-4-lite default).
 * Returns `null` when Voyage is disabled via `VOYAGE_DISABLED` (caller should no-op).
 */
export async function voyageEmbedSingle (
  text: string,
  inputType: 'document' | 'query'
): Promise<number[] | null> {
  if (!isVoyageEmbeddingsEnabled()) {
    return null
  }
  const key = process.env.VOYAGE_API_KEY
  if (key == null || key === '') {
    throw new Error('VOYAGE_API_KEY is not set in Convex environment')
  }
  const model = voyageEmbeddingModel()
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      input: [text],
      model,
      input_type: inputType
    })
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Voyage embeddings failed: ${res.status} ${errText}`)
  }
  const json = (await res.json()) as {
    data?: Array<{ embedding: number[] }>
  }
  const emb = json.data?.[0]?.embedding
  if (emb == null || emb.length !== 1024) {
    throw new Error(
      `Voyage returned unexpected embedding length: ${emb?.length ?? 0}`
    )
  }
  return emb
}
