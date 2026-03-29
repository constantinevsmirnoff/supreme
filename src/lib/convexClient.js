import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api.js'
import { getConvexDeploymentUrl } from '@/src/config/convexRuntime.js'

let client = null
let clientUrl = null

/**
 * @returns {ConvexHttpClient | null}
 */
export function getConvexClient () {
  const url = getConvexDeploymentUrl()
  if (!url) return null
  if (!client || clientUrl !== url) {
    client = new ConvexHttpClient(url)
    clientUrl = url
  }
  return client
}

export { api }
