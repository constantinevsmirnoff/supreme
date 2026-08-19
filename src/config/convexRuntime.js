/**
 * Convex deployment URL. In dev, `enableConvexDevelopmentDeployment()` in `App.vue`
 * points at `CONVEX_DEVELOPMENT_URL` so local work does not require `.env.local`.
 * Production builds should set `VITE_CONVEX_URL` (e.g. from `convex deploy --cmd`).
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

