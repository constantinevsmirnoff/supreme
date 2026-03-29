import { isConvexBackendActive } from '@/src/config/convexRuntime.js'

/**
 * Convex when `enableConvexDevelopmentDeployment()` ran in App.vue, or when
 * VITE_DATA_BACKEND=convex and VITE_CONVEX_URL are set. Otherwise mock API.
 */
export function useConvexBackend () {
  return isConvexBackendActive()
}
