/**
 * Convex development deployment (dashboard “Development”). Call
 * `enableConvexDevelopmentDeployment()` from `App.vue` so the UI uses this URL
 * without requiring `VITE_CONVEX_URL` / `VITE_DATA_BACKEND` in `.env.local`.
 */
export const CONVEX_DEVELOPMENT_URL =
  'https://resolute-ant-116.eu-west-1.convex.cloud'

let useDevelopmentDeployment = false

export function enableConvexDevelopmentDeployment () {
  useDevelopmentDeployment = true
}

export function getConvexDeploymentUrl () {
  if (useDevelopmentDeployment) return CONVEX_DEVELOPMENT_URL
  const envUrl = import.meta.env.VITE_CONVEX_URL
  if (envUrl && String(envUrl).trim() !== '') return String(envUrl).trim()
  return ''
}

export function isConvexBackendActive () {
  const url = getConvexDeploymentUrl()
  if (!url) return false
  if (useDevelopmentDeployment) return true
  return import.meta.env.VITE_DATA_BACKEND === 'convex'
}
