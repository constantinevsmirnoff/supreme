import { ref } from 'vue'
import { getConvexClient, api } from '@/src/lib/convexClient.js'

export const jobs = ref([])
export const templates = ref([])
/** @type {import('vue').Ref<Array<{ id: string, title: string, thumbnail: string, isHomepage: boolean, parentFolderId: string | null }>>} */
export const customPages = ref([])
/** @type {import('vue').Ref<Array<{ id: string, title: string, thumbnail: string, isHomepage: boolean, parentFolderId: string | null }>>} */
export const customPagesGridView = ref([])
/** @type {import('vue').Ref<Array<{ id: string, title: string, parentFolderId: string | null }>>} */
export const customFolders = ref([])
/** @type {import('vue').Ref<Array<{ id: string, title: string, parentFolderId: string | null }>>} */
export const customFoldersGridView = ref([])
export const templateCounts = ref({})
/** @type {import('vue').Ref<Record<string, string>>} */
export const manualOverrideByJobId = ref({})

/** Emitted by JobCard template dropdown “Auto”; JobList clears manual override for that job. */
export const TEMPLATE_DROPDOWN_AUTO_VALUE = '__auto_assign__'

/** Debounced job-list search (Convex query `jobFilters.search`). */
export const jobListSearchDebounced = ref('')
/**
 * Job list facet filters (locations, industries, companies, templateTitles, status).
 * Convex: empty arrays / missing status = no constraint for that dimension.
 * @type {import('vue').Ref<{
 *   locations: string[]
 *   industries: string[]
 *   companies: string[]
 *   templateTitles: string[]
 *   status?: 'active' | 'inactive'
 * }>}
 */
export const jobListFacetFilters = ref({
  locations: [],
  industries: [],
  companies: [],
  templateTitles: [],
  status: undefined
})
/** Debounced Page Manager template search (Convex query `templateFilters.search`). */
export const pageManagerSearchDebounced = ref('')
/** Jobs after `jobFilters` (substring search). */
export const jobsListView = ref([])
/** Templates after `templateFilters` + default-first sort. */
export const templatesGridView = ref([])
/** Global priority list; top-first. */
export const assignmentActiveAttributes = ref([])
/** True after `seedIfEmpty` runs. */
export const convexBootstrapReady = ref(false)
/** Bumped after Convex writes so `ConvexWorkspaceSync` re-runs `listWithAssignments`. */
export const convexPullNonce = ref(0)

let loadPromise = null

export function loadJobsAndTemplates () {
  if (!loadPromise) {
    loadPromise = (async () => {
      const client = getConvexClient()
      if (client) {
        await client.mutation(api.seed.seedIfEmpty, {})
      }
      convexBootstrapReady.value = true
    })()
  }
  return loadPromise
}

export async function clearManualOverrides () {
  const client = getConvexClient()
  if (!client) return
  await client.mutation(api.jobs.clearAllManualJobTemplates, {})
  convexPullNonce.value++
}

/**
 * @param {string} jobId
 * @param {string} templateTitle
 */
export async function setManualTemplateForJob (jobId, templateTitle) {
  const client = getConvexClient()
  if (!client) return
  await client.mutation(api.jobs.setManualJobTemplateByExternalId, {
    externalId: jobId,
    manualTemplateTitle: templateTitle
  })
  convexPullNonce.value++
}

/**
 * Remove manual template pick so the job uses conditional auto-assignment again.
 * @param {string} jobId
 */
export async function clearManualTemplateForJob (jobId) {
  const client = getConvexClient()
  if (!client) return
  await client.mutation(api.jobs.setManualJobTemplateByExternalId, {
    externalId: jobId,
    manualTemplateTitle: null
  })
  convexPullNonce.value++
}

/**
 * Persist template condition tags from Page Manager overlay.
 * @param {string} templateId
 * @param {{ locationValues: string[], industryValues: string[], companyValues: string[], titleValues: string[] }} payload
 */
export async function applyTemplateConditions (templateId, payload) {
  const client = getConvexClient()
  if (!client) return
  await client.mutation(api.jobTemplates.patchConditionsByExternalId, {
    externalId: templateId,
    locationValues: [...payload.locationValues],
    industryValues: [...payload.industryValues],
    companyValues: [...payload.companyValues],
    titleValues: [...(payload.titleValues ?? [])]
  })
  convexPullNonce.value++
}

export async function setTemplateActive (templateId, active) {
  const t = templates.value.find((x) => x.id === templateId)
  if (!t || t.isDefault) return { ok: false, code: 'INVALID_TEMPLATE' }
  const client = getConvexClient()
  if (!client) return { ok: false, code: 'CLIENT_UNAVAILABLE' }
  try {
    await client.mutation(api.jobTemplates.setTemplateActiveByExternalId, {
      externalId: templateId,
      templateActive: active
    })
    convexPullNonce.value++
    return { ok: true }
  } catch (err) {
    const data = err?.data
    const code =
      data && typeof data === 'object' && typeof data.code === 'string'
        ? data.code
        : 'UNKNOWN'
    const message =
      data && typeof data === 'object' && typeof data.message === 'string'
        ? data.message
        : (err instanceof Error ? err.message : 'Failed to change template activation.')
    return { ok: false, code, message, data }
  }
}

/**
 * Persist globally active assignment attributes order.
 * @param {Array<'location'|'industry'|'company'|'title'>} attributes
 */
export async function setAssignmentActiveAttributes (attributes) {
  const client = getConvexClient()
  if (!client) return
  await client.mutation(api.assignmentSettings.setActiveAttributes, {
    activeAttributes: [...attributes]
  })
  convexPullNonce.value++
}

/**
 * Delete a non-default template.
 * @param {string} templateId
 */
export async function deleteTemplate (templateId) {
  const t = templates.value.find((x) => x.id === templateId)
  if (!t || t.isDefault) return
  const client = getConvexClient()
  if (!client) return
  await client.mutation(api.jobTemplates.removeByExternalId, {
    externalId: templateId
  })
  convexPullNonce.value++
}

/**
 * Create a blank non-default template (inactive, no conditions).
 * @returns {Promise<string | null>} new template id, or null if Convex client missing
 */
export async function createUntitledJobTemplate () {
  const client = getConvexClient()
  if (!client) return null
  const id = await client.mutation(api.jobTemplates.createUntitled, {})
  convexPullNonce.value++
  return id
}

export async function duplicateTemplate (templateId) {
  const t = templates.value.find((x) => x.id === templateId)
  if (!t || t.isDefault) return null
  const client = getConvexClient()
  if (!client) return null
  const newId = await client.mutation(api.jobTemplates.duplicateByExternalId, {
    externalId: templateId
  })
  convexPullNonce.value++
  return newId
}

export async function renameTemplate (templateId, newTitle) {
  const t = templates.value.find((x) => x.id === templateId)
  if (!t) return
  const trimmed = newTitle.trim()
  if (t.title === trimmed) return
  const client = getConvexClient()
  if (!client) return
  await client.mutation(api.jobTemplates.renameByExternalId, {
    externalId: templateId,
    title: trimmed
  })
  convexPullNonce.value++
}

/**
 * POST file to Convex upload URL; returns storage id from JSON body.
 * @param {string} postUrl
 * @param {File} file
 * @param {(percent: number) => void} [onProgress]
 * @returns {Promise<string>}
 */
function postFileToConvexUploadUrl (postUrl, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', postUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === 'function') {
        onProgress(Math.round((100 * e.loaded) / e.total))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          const id = data.storageId
          if (typeof id === 'string' && id.length > 0) {
            resolve(id)
            return
          }
        } catch {
          /* fall through */
        }
      }
      reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`))
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(file)
  })
}

/**
 * Upload a template thumbnail (JPEG/PNG ≤ 2 MB); validates on client before upload.
 * @param {string} templateId
 * @param {File} file
 * @param {(percent: number) => void} [onProgress]
 */
export async function uploadTemplateThumbnail (templateId, file, onProgress) {
  const maxBytes = 2 * 1024 * 1024
  const okType =
    file.type === 'image/jpeg' || file.type === 'image/png'
  if (!okType || file.size > maxBytes) {
    throw new Error('Choose a JPG or PNG file up to 2 MB.')
  }
  const client = getConvexClient()
  if (!client) return
  const postUrl = await client.mutation(
    api.jobTemplates.generateThumbnailUploadUrl,
    {}
  )
  const storageId = await postFileToConvexUploadUrl(postUrl, file, onProgress)
  await client.mutation(api.jobTemplates.finalizeThumbnailUpload, {
    externalId: templateId,
    storageId,
    fileName: file.name
  })
  convexPullNonce.value++
}

/**
 * Remove template thumbnail from storage and clear fields.
 * @param {string} templateId
 */
export async function clearTemplateThumbnail (templateId) {
  const client = getConvexClient()
  if (!client) return
  await client.mutation(api.jobTemplates.clearThumbnailByExternalId, {
    externalId: templateId
  })
  convexPullNonce.value++
}

/**
 * @param {{ title?: string, parentFolderExternalId: string | null }} [opts]
 * @returns {Promise<string | null>} new folder external id
 */
export async function createCustomFolder (opts = {}) {
  const client = getConvexClient()
  if (!client) return null
  const { externalId } = await client.mutation(api.flexiblePages.createFolder, {
    title: opts.title,
    parentFolderExternalId: opts.parentFolderExternalId ?? null
  })
  convexPullNonce.value++
  return externalId
}

/**
 * @param {{ title?: string, parentFolderExternalId: string | null }} [opts]
 * @returns {Promise<string | null>} new page external id
 */
export async function createFlexibleCustomPage (opts = {}) {
  const client = getConvexClient()
  if (!client) return null
  const { externalId } = await client.mutation(
    api.flexiblePages.createCustomPage,
    {
      title: opts.title,
      parentFolderExternalId: opts.parentFolderExternalId ?? null
    }
  )
  convexPullNonce.value++
  return externalId
}

/**
 * @param {string[]} pageExternalIds
 * @param {string | null} targetParentFolderExternalId
 */
export async function moveFlexiblePagesToFolder (
  pageExternalIds,
  targetParentFolderExternalId
) {
  const client = getConvexClient()
  if (!client) return
  await client.mutation(api.flexiblePages.moveCustomPages, {
    pageExternalIds: [...pageExternalIds],
    targetParentFolderExternalId: targetParentFolderExternalId ?? null
  })
  convexPullNonce.value++
}

/**
 * @param {string[]} folderExternalIds
 * @param {string | null} targetParentFolderExternalId
 */
export async function moveFlexibleFoldersToFolder (
  folderExternalIds,
  targetParentFolderExternalId
) {
  const client = getConvexClient()
  if (!client) return
  await client.mutation(api.flexiblePages.moveFolders, {
    folderExternalIds: [...folderExternalIds],
    targetParentFolderExternalId: targetParentFolderExternalId ?? null
  })
  convexPullNonce.value++
}

/**
 * @param {string[]} externalIds
 */
export async function deleteFlexibleCustomPages (externalIds) {
  const client = getConvexClient()
  if (!client) return
  await client.mutation(api.flexiblePages.deleteCustomPages, {
    externalIds: [...externalIds]
  })
  convexPullNonce.value++
}

/**
 * @param {string[]} externalIds
 */
export async function deleteFlexibleFoldersRecursive (externalIds) {
  const client = getConvexClient()
  if (!client) return
  await client.mutation(api.flexiblePages.deleteCustomFoldersRecursive, {
    externalIds: [...externalIds]
  })
  convexPullNonce.value++
}

/**
 * @param {string} externalId
 * @param {string} title
 */
export async function renameFlexibleCustomPage (externalId, title) {
  const client = getConvexClient()
  if (!client) return
  await client.mutation(api.flexiblePages.renameCustomPageByExternalId, {
    externalId,
    title
  })
  convexPullNonce.value++
}

/**
 * @param {string} externalId
 * @param {string} title
 */
export async function renameFlexibleFolder (externalId, title) {
  const client = getConvexClient()
  if (!client) return
  await client.mutation(api.flexiblePages.renameFolderByExternalId, {
    externalId,
    title
  })
  convexPullNonce.value++
}
