<script setup lang="ts">
/**
 * Page Manager — Flexible Pages: folders, drag-drop, marquee, context delete (Convex-backed).
 */
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import JobListHeader from '@/components/JobListHeader.vue'
import PageManagerNewFlyout from '@/components/PageManagerNewFlyout.vue'
import Button from '@/components/ui/Button.vue'
import GhostButton from '@/components/ui/GhostButton.vue'
import TabSlider from '@/components/ui/TabSlider.vue'
import PageCard from '@/components/ui/PageCard.vue'
import PageFolder from '@/components/ui/PageFolder.vue'
import JobTemplateCard from '@/components/JobTemplateCard.vue'
import JobTemplateOverlay from '@/components/JobTemplateOverlay.vue'
import AssignmentSettingsOverlay from '@/components/AssignmentSettingsOverlay.vue'
import TemplateActivationErrorOverlay from '@/components/TemplateActivationErrorOverlay.vue'
import ContextMenuItem from '@/components/ui/ContextMenuItem.vue'
import { useFlexiblePagesDrag } from '@/src/composables/useFlexiblePagesDrag.js'
import {
  jobs,
  templates,
  templatesGridView,
  customPagesGridView,
  customPages,
  customFolders,
  customFoldersGridView,
  templateCounts,
  assignmentActiveAttributes,
  pageManagerSearchDebounced,
  loadJobsAndTemplates,
  setAssignmentActiveAttributes,
  applyTemplateConditions,
  renameTemplate,
  setTemplateActive,
  duplicateTemplate,
  deleteTemplate,
  createUntitledJobTemplate,
  createCustomFolder,
  createFlexibleCustomPage,
  moveFlexiblePagesToFolder,
  moveFlexibleFoldersToFolder,
  deleteFlexibleCustomPages,
  deleteFlexibleFoldersRecursive,
  renameFlexibleCustomPage,
  renameFlexibleFolder
} from '@/src/state/jobsAndTemplatesStore.js'

type JobTemplate = {
  id: string
  title: string
  thumbnail: string
  thumbnailFileName?: string
  isDefault?: boolean
  templateActive?: boolean
  locationEquals: string | null
  industryEquals: string | null
  companyEquals: string | null
  locationValues: string[]
  industryValues: string[]
  companyValues: string[]
  titleValues?: string[]
  conditionsEditedAt?: number
}

function keyPage (id: string): string {
  return `page:${id}`
}

function keyFolder (id: string): string {
  return `folder:${id}`
}

function parentEq (
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const na = a == null ? null : a
  const nb = b == null ? null : b
  return na === nb
}

const searchQuery = ref('')
const pageManagerRootRef = ref<HTMLElement | null>(null)
const PAGE_MANAGER_VIEW_TAB_KEY = 'page-manager-view-tab'

function loadPageManagerViewTab (): number {
  if (typeof localStorage === 'undefined') return 0
  try {
    const raw = localStorage.getItem(PAGE_MANAGER_VIEW_TAB_KEY)
    if (raw == null) return 0
    const n = Number.parseInt(raw, 10)
    if (n === 0 || n === 1) return n
  } catch {
    /* private mode / quota */
  }
  return 0
}

function savePageManagerViewTab (value: number): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(PAGE_MANAGER_VIEW_TAB_KEY, String(value))
  } catch {
    /* ignore */
  }
}

const pageManagerViewTab = ref(loadPageManagerViewTab())
const currentFolderId = ref<string | null>(null)

const selectedFlexibleKeys = ref<Set<string>>(new Set())

const marqueeState = ref<{
  x1: number
  y1: number
  x2: number
  y2: number
} | null>(null)

const gridCellEls = new Map<string, HTMLElement>()
let marqueeDragging = false

const dropHighlight = ref<'back' | string | null>(null)

const contextMenuOpen = ref(false)
const contextMenuStyle = ref<Record<string, string>>({})
const contextMenuPanelRef = ref<HTMLElement | null>(null)

const folderById = computed(() => {
  const m = new Map<string, { id: string; title: string; parentFolderId: string | null }>()
  for (const f of customFolders.value as Array<{
    id: string
    title: string
    parentFolderId: string | null
  }>) {
    m.set(f.id, f)
  }
  return m
})

const currentFolderRecord = computed(() => {
  const id = currentFolderId.value
  if (id == null) return null
  return folderById.value.get(id) ?? null
})

/** Parent folder id when inside a folder (null = go to root). */
const parentOfCurrentFolder = computed((): string | null => {
  const rec = currentFolderRecord.value
  if (rec == null) return null
  return rec.parentFolderId
})

const backCardTitle = computed(() => {
  const rec = currentFolderRecord.value
  if (rec == null) return 'Back'
  return rec.title
})

function visibleInFolder<T extends { parentFolderId: string | null }> (
  rows: T[]
): T[] {
  const cur = currentFolderId.value
  return rows.filter((r) => parentEq(r.parentFolderId, cur))
}

const visibleFolders = computed(() => {
  const rows = visibleInFolder(
    customFoldersGridView.value as Array<{
      id: string
      title: string
      parentFolderId: string | null
    }>
  )
  return [...rows].sort((a, b) =>
    (a.title ?? '').localeCompare(b.title ?? '', undefined, {
      sensitivity: 'base'
    })
  )
})

const visiblePages = computed(() => {
  const rows = visibleInFolder(
    customPagesGridView.value as Array<{
      id: string
      title: string
      thumbnail: string
      isHomepage: boolean
      parentFolderId: string | null
    }>
  )
  return [...rows].sort((a, b) => {
    const h = Number(b.isHomepage) - Number(a.isHomepage)
    if (h !== 0) return h
    return (a.title ?? '').localeCompare(b.title ?? '', undefined, {
      sensitivity: 'base'
    })
  })
})

function registerGridCell (key: string, el: unknown) {
  if (el instanceof HTMLElement) gridCellEls.set(key, el)
  else gridCellEls.delete(key)
}

function isMarqueeBlockedTarget (target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return true
  if (target.closest('.page-manager-new-flyout')) return true
  if (target.closest('.search-field')) return true
  if (target.closest('.page-manager__grid-cell--back')) return true
  if (target.closest('.page-manager__grid-cell--page')) return true
  if (target.closest('.page-manager__grid-cell--folder')) return true
  return Boolean(
    target.closest(
      'button, a[href], label, input, textarea, select, [role="button"], [role="tab"], [role="menuitem"], [role="menuitemcheckbox"], [role="option"], [contenteditable="true"]'
    )
  )
}

function normalizeMarqueeRect (
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  const left = Math.min(x1, x2)
  const top = Math.min(y1, y2)
  const width = Math.abs(x2 - x1)
  const height = Math.abs(y2 - y1)
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height
  }
}

function clientRectsOverlap (
  a: DOMRectReadOnly,
  b: { left: number; top: number; right: number; bottom: number }
) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom)
}

const marqueeBoxStyle = computed(() => {
  const m = marqueeState.value
  if (!m) return {}
  const { left, top, width, height } = normalizeMarqueeRect(m.x1, m.y1, m.x2, m.y2)
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`
  }
})

function onWindowMouseMove (e: MouseEvent) {
  if (!marqueeDragging || !marqueeState.value) return
  const m = marqueeState.value
  marqueeState.value = { ...m, x2: e.clientX, y2: e.clientY }
}

function teardownMarqueeListeners () {
  window.removeEventListener('mousemove', onWindowMouseMove)
  window.removeEventListener('mouseup', onWindowMouseUp)
}

function toggleShiftFlexibleKey (key: string) {
  if (pageManagerViewTab.value !== 0) return
  const next = new Set(selectedFlexibleKeys.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  selectedFlexibleKeys.value = next
}

function onPageCellShiftMouseDown (e: MouseEvent) {
  if (e.button !== 0) return
  e.preventDefault()
}

function onWindowMouseUp (e: MouseEvent) {
  if (!marqueeDragging) return
  marqueeDragging = false
  teardownMarqueeListeners()

  const m = marqueeState.value
  marqueeState.value = null

  if (!m || pageManagerViewTab.value !== 0) return

  const r = normalizeMarqueeRect(m.x1, m.y1, e.clientX, e.clientY)
  const thresholdPx = 4
  if (r.width < thresholdPx && r.height < thresholdPx) {
    const endEl = document.elementFromPoint(e.clientX, e.clientY)
    if (
      endEl instanceof Element &&
      (endEl.closest('.page-manager__grid-cell--page') ||
        endEl.closest('.page-manager__grid-cell--folder'))
    ) {
      return
    }
    selectedFlexibleKeys.value = new Set()
    return
  }

  const box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
  const next = new Set<string>()
  for (const f of visibleFolders.value) {
    const el = gridCellEls.get(keyFolder(f.id))
    if (!el) continue
    if (clientRectsOverlap(el.getBoundingClientRect(), box)) next.add(keyFolder(f.id))
  }
  for (const p of visiblePages.value) {
    const el = gridCellEls.get(keyPage(p.id))
    if (!el) continue
    if (clientRectsOverlap(el.getBoundingClientRect(), box)) next.add(keyPage(p.id))
  }
  selectedFlexibleKeys.value = next
}

function onPageManagerMouseDown (e: MouseEvent) {
  if (pageManagerViewTab.value !== 0) return
  if (e.button !== 0) return
  if (e.shiftKey) return
  if (isMarqueeBlockedTarget(e.target)) return

  e.preventDefault()
  marqueeDragging = true
  marqueeState.value = {
    x1: e.clientX,
    y1: e.clientY,
    x2: e.clientX,
    y2: e.clientY
  }
  window.addEventListener('mousemove', onWindowMouseMove)
  window.addEventListener('mouseup', onWindowMouseUp)
}

function onDocumentMouseDownCapture (e: MouseEvent) {
  const root = pageManagerRootRef.value
  if (!root || !(e.target instanceof Node) || !root.contains(e.target)) return
  onPageManagerMouseDown(e)
}

watch(pageManagerViewTab, (v) => {
  savePageManagerViewTab(v)
  selectedFlexibleKeys.value = new Set()
  marqueeState.value = null
  currentFolderId.value = null
  if (marqueeDragging) {
    teardownMarqueeListeners()
    marqueeDragging = false
  }
  closeContextMenu()
})

let templateSearchDebounceTimer: ReturnType<typeof setTimeout> | undefined
watch(searchQuery, (q) => {
  clearTimeout(templateSearchDebounceTimer)
  templateSearchDebounceTimer = setTimeout(() => {
    pageManagerSearchDebounced.value = q
  }, 280)
})

onBeforeUnmount(() => {
  clearTimeout(templateSearchDebounceTimer)
  if (marqueeDragging) teardownMarqueeListeners()
  document.removeEventListener('mousedown', onDocumentMouseDownCapture, true)
  closeContextMenuListeners()
})

const overlayTemplateId = ref<string | null>(null)
const assignmentSettingsOpen = ref(false)
const templateActivationError = ref('')

const overlayTemplate = computed(
  () => templates.value.find((t) => t.id === overlayTemplateId.value) ?? null
)

const filteredTemplates = computed(
  () => templatesGridView.value as JobTemplate[]
)

function openOverlay (id: string) {
  overlayTemplateId.value = id
}

function closeOverlay () {
  overlayTemplateId.value = null
}

function openAssignmentSettingsOverlay () {
  assignmentSettingsOpen.value = true
}

function closeAssignmentSettingsOverlay () {
  assignmentSettingsOpen.value = false
}

function onSaveAssignmentSettings (
  attrs: Array<'location' | 'industry' | 'company' | 'title'>
) {
  void setAssignmentActiveAttributes(attrs)
}

function onDeleteTemplate (id: string) {
  void deleteTemplate(id).then(() => {
    if (overlayTemplateId.value === id) closeOverlay()
  })
}

async function onNewTemplate () {
  const id = await createUntitledJobTemplate()
  if (id) openOverlay(id)
}

async function onFlyoutNewFolder () {
  if (pageManagerViewTab.value !== 0) return
  await createCustomFolder({
    parentFolderExternalId: currentFolderId.value
  })
}

async function onFlyoutNewPage () {
  if (pageManagerViewTab.value !== 0) return
  await createFlexibleCustomPage({
    parentFolderExternalId: currentFolderId.value
  })
}

function onTemplateApply (payload: {
  locationValues: string[]
  industryValues: string[]
  companyValues: string[]
  titleValues: string[]
}) {
  const t = overlayTemplate.value
  if (!t) return
  void applyTemplateConditions(t.id, payload)
}

function onOverlayRenameTitle (newTitle: string) {
  const t = overlayTemplate.value
  if (!t) return
  void renameTemplate(t.id, newTitle)
}

async function onSetTemplateActive (templateId: string, active: boolean) {
  const result = await setTemplateActive(templateId, active)
  if (result?.ok) return
  const conflictTitle = result?.data?.conflictingTemplateTitle
  if (result?.code === 'DUPLICATE_ASSIGNMENT_CONDITIONS' && conflictTitle) {
    templateActivationError.value =
      `This template has the same active assignment conditions as "${String(conflictTitle)}". ` +
      'Change conditions or deactivate the other template first.'
    return
  }
  templateActivationError.value =
    result?.message ?? 'Failed to change template activation.'
}

function openFolder (id: string) {
  currentFolderId.value = id
  selectedFlexibleKeys.value = new Set()
}

function navigateFolderBack () {
  currentFolderId.value = parentOfCurrentFolder.value
  selectedFlexibleKeys.value = new Set()
}

const flexDrag = useFlexiblePagesDrag({
  isEnabled: () => pageManagerViewTab.value === 0,
  buildPayload: (start) => {
    const sel = selectedFlexibleKeys.value
    const startKey = start.kind === 'page' ? keyPage(start.id) : keyFolder(start.id)
    const pageIds = new Set<string>()
    const folderIds = new Set<string>()
    if (sel.size > 0 && sel.has(startKey)) {
      for (const k of sel) {
        if (k.startsWith('page:')) pageIds.add(k.slice(5))
        else if (k.startsWith('folder:')) folderIds.add(k.slice(7))
      }
    } else {
      if (start.kind === 'page') pageIds.add(start.id)
      else folderIds.add(start.id)
    }
    const ghostItems: Array<{ title: string; thumbnail?: string }> = []
    const pagesArr = customPages.value as Array<{
      id: string
      title: string
      thumbnail: string
    }>
    const foldersArr = customFolders.value as Array<{ id: string; title: string }>
    for (const pid of pageIds) {
      const p = pagesArr.find((x) => x.id === pid)
      if (p) ghostItems.push({ title: p.title, thumbnail: p.thumbnail })
    }
    for (const fid of folderIds) {
      const f = foldersArr.find((x) => x.id === fid)
      if (f) ghostItems.push({ title: f.title })
    }
    return {
      pageIds: [...pageIds],
      folderIds: [...folderIds],
      ghostItems: ghostItems.slice(0, 5)
    }
  },
  onDrop: (clientX, clientY, pl) => {
    const el = document.elementFromPoint(clientX, clientY)
    if (!(el instanceof Element)) return
    let targetParent: string | null | undefined
    if (el.closest('[data-pm-back-drop="true"]')) {
      targetParent = parentOfCurrentFolder.value
    } else {
      const fe = el.closest('[data-pm-folder-drop]')
      if (fe instanceof HTMLElement) {
        const fid = fe.dataset.pmFolderDrop
        if (fid) {
          targetParent = fid
        }
      }
    }
    if (targetParent === undefined) return
    const folderIds = pl.folderIds.filter((id) => id !== targetParent)
    void (async () => {
      if (pl.pageIds.length > 0) {
        await moveFlexiblePagesToFolder(pl.pageIds, targetParent ?? null)
      }
      if (folderIds.length > 0) {
        await moveFlexibleFoldersToFolder(folderIds, targetParent ?? null)
      }
      selectedFlexibleKeys.value = new Set()
    })()
  },
  setDropHighlight: (t) => {
    dropHighlight.value = t
  }
})

const flexDragging = flexDrag.dragging
const flexPayload = flexDrag.payload
const flexSwingAngle = flexDrag.swingAngle
const flexGhostStyleRoot = flexDrag.ghostStyleRoot

/** Reactive fan + hinge swing per ghost card (tracks flexSwingAngle). */
const ghostCardStyles = computed(() => {
  const items = flexPayload.value?.ghostItems
  if (items == null || items.length === 0) return []
  const swing = flexSwingAngle.value
  return items.map((_, index) => {
    const stagger = 1 - index * 0.07
    const swingRot = swing * stagger
    const spread = index * 5
    const rot = -10 + index * 5 + swingRot
    return {
      transform: `translate(${-spread}px, ${-spread * 0.6}px) rotate(${rot}deg)`,
      zIndex: String(100 + index)
    }
  })
})

function isDraggingSourceKey (k: string): boolean {
  const p = flexPayload.value
  if (p == null) return false
  for (const id of p.pageIds) {
    if (keyPage(id) === k) return true
  }
  for (const id of p.folderIds) {
    if (keyFolder(id) === k) return true
  }
  return false
}

function onFlexiblePointerDown (
  e: MouseEvent,
  kind: 'page' | 'folder',
  id: string
) {
  flexDrag.onCellPointerDown(e, { kind, id })
}

const deleteMenuLabel = computed(() => {
  const n = selectedFlexibleKeys.value.size
  let pages = 0
  let folders = 0
  for (const k of selectedFlexibleKeys.value) {
    if (k.startsWith('page:')) pages++
    else folders++
  }
  if (n === 0) return 'Delete'
  if (folders > 0 && pages > 0) return n === 1 ? 'Delete' : `Delete ${n} items`
  if (folders > 0) return n === 1 ? 'Delete folder' : `Delete ${n} folders`
  return n === 1 ? 'Delete page' : `Delete ${n} pages`
})

/** Rename only when exactly one page or one folder is selected. */
const contextRenameSingle = computed((): {
  kind: 'page' | 'folder'
  id: string
} | null => {
  if (selectedFlexibleKeys.value.size !== 1) return null
  const k = [...selectedFlexibleKeys.value][0]
  if (k.startsWith('page:')) {
    return { kind: 'page', id: k.slice(5) }
  }
  if (k.startsWith('folder:')) {
    return { kind: 'folder', id: k.slice(7) }
  }
  return null
})

const renameMenuLabel = computed(() => {
  const s = contextRenameSingle.value
  if (s == null) return 'Rename'
  return s.kind === 'folder' ? 'Rename folder' : 'Rename page'
})

function closeContextMenuListeners () {
  document.removeEventListener(
    'pointerdown',
    onDocumentPointerDownCloseMenu,
    true
  )
  document.removeEventListener('keydown', onDocumentKeydownCloseMenu, true)
}

function onDocumentPointerDownCloseMenu (e: PointerEvent) {
  const panel = contextMenuPanelRef.value
  if (panel && e.target instanceof Node && panel.contains(e.target)) return
  closeContextMenu()
}

function onDocumentKeydownCloseMenu (e: KeyboardEvent) {
  if (e.key === 'Escape') closeContextMenu()
}

function closeContextMenu () {
  contextMenuOpen.value = false
  closeContextMenuListeners()
}

function openContextMenu (e: MouseEvent, key: string) {
  if (pageManagerViewTab.value !== 0) return
  e.preventDefault()
  if (!selectedFlexibleKeys.value.has(key)) {
    selectedFlexibleKeys.value = new Set([key])
  }
  contextMenuOpen.value = true
  contextMenuStyle.value = {
    position: 'fixed',
    left: `${e.clientX}px`,
    top: `${e.clientY}px`,
    zIndex: '10070'
  }
  nextTick(() => {
    document.addEventListener('pointerdown', onDocumentPointerDownCloseMenu, true)
    document.addEventListener('keydown', onDocumentKeydownCloseMenu, true)
  })
}

async function onContextRename () {
  const single = contextRenameSingle.value
  closeContextMenu()
  if (single == null) return

  const pages = customPages.value as Array<{ id: string; title: string }>
  const folders = customFolders.value as Array<{ id: string; title: string }>

  const currentTitle =
    single.kind === 'page'
      ? (pages.find((p) => p.id === single.id)?.title ?? '')
      : (folders.find((f) => f.id === single.id)?.title ?? '')

  const next = window.prompt('Name', currentTitle)
  if (next == null) return
  const trimmed = next.trim()
  if (trimmed === '' || trimmed === currentTitle) return

  if (single.kind === 'page') {
    await renameFlexibleCustomPage(single.id, trimmed)
  } else {
    await renameFlexibleFolder(single.id, trimmed)
  }
}

async function onContextDelete () {
  const keys = [...selectedFlexibleKeys.value]
  closeContextMenu()
  if (keys.length === 0) return
  const pageIds: string[] = []
  const folderIds: string[] = []
  for (const k of keys) {
    if (k.startsWith('page:')) pageIds.push(k.slice(5))
    else if (k.startsWith('folder:')) folderIds.push(k.slice(7))
  }
  const msg =
    folderIds.length > 0
      ? 'Delete selected folders (and everything inside)? This cannot be undone.'
      : pageIds.length > 1
        ? `Delete ${pageIds.length} pages?`
        : 'Delete this page?'
  if (!window.confirm(msg)) return

  const deletedFolderSet = new Set(folderIds)
  if (currentFolderId.value != null && deletedFolderSet.has(currentFolderId.value)) {
    currentFolderId.value = parentOfCurrentFolder.value
  }

  if (folderIds.length > 0) {
    await deleteFlexibleFoldersRecursive(folderIds)
  }
  if (pageIds.length > 0) {
    await deleteFlexibleCustomPages(pageIds)
  }
  selectedFlexibleKeys.value = new Set()
}

onMounted(() => {
  document.addEventListener('mousedown', onDocumentMouseDownCapture, true)
  pageManagerSearchDebounced.value = searchQuery.value
  void loadJobsAndTemplates()
})
</script>

<template>
  <div
    ref="pageManagerRootRef"
    class="page-manager"
    :class="{
      'page-manager--marquee-drag': marqueeState != null,
      'page-manager--flex-drag': flexDragging
    }"
  >
    <JobListHeader
      v-model:search-query="searchQuery"
      title="Assignment settings"
      description="Here you can find all of your custom pages and job templates. Control how your career website is structured by creating pages and managing job templates."
      search-placeholder="Search for titles, companies, job categories, etc."
      :show-secondary-action="false"
      :show-clear-manual-overrides="false"
      :show-job-list-filters="false"
      search-cluster-layout="between"
    >
      <template #primaryAction>
        <PageManagerNewFlyout
          v-if="pageManagerViewTab === 0"
          label="New +"
          @new-page="onFlyoutNewPage"
          @new-folder="onFlyoutNewFolder"
        />
        <Button
          v-else
          variant="accent"
          type="button"
          @click="onNewTemplate"
        >
          New +
        </Button>
      </template>
      <template #aboveSearch>
        <TabSlider
          v-model="pageManagerViewTab"
          option1-label="Flexible Pages"
          option2-label="Job Templates"
        />
      </template>
      <template #searchClusterAppend>
        <GhostButton
          type="button"
          :show-icon="false"
          @click="openAssignmentSettingsOverlay"
        >
          Assignment settings
        </GhostButton>
      </template>
    </JobListHeader>
    <main class="page-manager__main" aria-label="Page manager content">
      <Transition name="page-manager-grid" mode="out-in">
        <div
          v-if="pageManagerViewTab === 0"
          key="pages"
          class="page-manager__grid page-manager__grid--pages"
        >
          <div
            v-if="currentFolderId != null"
            key="back"
            class="page-manager__grid-cell page-manager__grid-cell--back"
          >
            <div
              data-pm-back-drop="true"
              class="page-manager__drop-surface"
              @dblclick.prevent="navigateFolderBack"
            >
              <PageCard
                variant="folderBack"
                :title="backCardTitle"
                :show-live="false"
                :show-default-badge="false"
                :drop-target="dropHighlight === 'back'"
                @dblclick.prevent.stop="navigateFolderBack"
              />
            </div>
          </div>
          <div
            v-for="folder in visibleFolders"
            :key="'f-' + folder.id"
            class="page-manager__grid-cell page-manager__grid-cell--folder"
            :ref="(el) => registerGridCell(keyFolder(folder.id), el)"
            @mousedown.shift="onPageCellShiftMouseDown"
            @click.shift.stop.prevent="toggleShiftFlexibleKey(keyFolder(folder.id))"
            @dblclick.prevent.stop="openFolder(folder.id)"
            @pointerdown="onFlexiblePointerDown($event, 'folder', folder.id)"
            @contextmenu.prevent="openContextMenu($event, keyFolder(folder.id))"
          >
            <div
              class="page-manager__drop-surface"
              :data-pm-folder-drop="folder.id"
            >
              <PageFolder
                :title="folder.title"
                icon-alt=""
                :selected="selectedFlexibleKeys.has(keyFolder(folder.id))"
                :drop-target="dropHighlight === folder.id"
                :dragging-source="isDraggingSourceKey(keyFolder(folder.id))"
              />
            </div>
          </div>
          <div
            v-for="page in visiblePages"
            :key="'p-' + page.id"
            class="page-manager__grid-cell page-manager__grid-cell--page"
            :ref="(el) => registerGridCell(keyPage(page.id), el)"
            @mousedown.shift="onPageCellShiftMouseDown"
            @click.shift.stop.prevent="toggleShiftFlexibleKey(keyPage(page.id))"
            @pointerdown="onFlexiblePointerDown($event, 'page', page.id)"
            @contextmenu.prevent="openContextMenu($event, keyPage(page.id))"
          >
            <PageCard
              :title="page.title"
              :thumbnail-src="page.thumbnail || undefined"
              :show-live="true"
              :show-default-badge="page.isHomepage"
              :is-default="page.isHomepage"
              :selected="selectedFlexibleKeys.has(keyPage(page.id))"
              :dragging-source="isDraggingSourceKey(keyPage(page.id))"
              default-label="Homepage"
            />
          </div>
        </div>
        <div
          v-else
          key="templates"
          class="page-manager__grid page-manager__grid--templates"
        >
          <div
            v-for="tpl in filteredTemplates"
            :key="tpl.id"
            class="page-manager__grid-cell page-manager__grid-cell--template"
          >
            <JobTemplateCard
              interactive
              :title="tpl.title"
              :thumbnail-src="tpl.thumbnail"
              :is-default="Boolean(tpl.isDefault)"
              :template-active="tpl.templateActive !== false"
              :assignment-active="tpl.isDefault ? undefined : (tpl.templateActive !== false)"
              :jobs-summary="`${templateCounts[tpl.id] ?? 0} jobs`"
              :location-values="tpl.locationValues"
              :industry-values="tpl.industryValues"
              :company-values="tpl.companyValues"
              :title-values="tpl.titleValues ?? []"
              :active-attributes="assignmentActiveAttributes"
              @open="openOverlay(tpl.id)"
              @update:title="(v) => renameTemplate(tpl.id, v)"
              @set-template-active="(active) => void onSetTemplateActive(tpl.id, active)"
              @duplicate="() => void duplicateTemplate(tpl.id)"
              @delete="() => onDeleteTemplate(tpl.id)"
            />
          </div>
        </div>
      </Transition>
    </main>

    <div
      v-if="marqueeState"
      class="page-manager__marquee"
      :style="marqueeBoxStyle"
      aria-hidden="true"
    />

    <Teleport to="body">
      <div
        v-if="flexDragging && flexPayload"
        class="page-manager__drag-ghost-root"
        :style="flexGhostStyleRoot"
        aria-hidden="true"
      >
        <div
          v-for="(item, idx) in flexPayload.ghostItems"
          :key="'g-' + idx"
          class="page-manager__drag-ghost-card"
          :style="ghostCardStyles[idx]"
        >
          <div class="page-manager__drag-ghost-thumb">
            <img
              v-if="item.thumbnail"
              class="page-manager__drag-ghost-img"
              :src="item.thumbnail"
              alt=""
            />
          </div>
          <p class="page-manager__drag-ghost-title">
            {{ item.title }}
          </p>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-show="contextMenuOpen"
        ref="contextMenuPanelRef"
        class="page-manager__context-menu context-menu"
        role="menu"
        aria-label="Flexible page actions"
        :style="contextMenuStyle"
      >
        <ContextMenuItem
          :label="renameMenuLabel"
          :disabled="contextRenameSingle == null"
          @click="onContextRename"
        />
        <ContextMenuItem
          :label="deleteMenuLabel"
          @click="onContextDelete"
        />
      </div>
    </Teleport>

    <JobTemplateOverlay
      v-if="overlayTemplate"
      :key="overlayTemplate.id"
      :template="overlayTemplate"
      :jobs="jobs"
      :active-attributes="assignmentActiveAttributes"
      @close="closeOverlay"
      @cancel="closeOverlay"
      @apply="onTemplateApply"
      @rename-title="onOverlayRenameTitle"
    />

    <AssignmentSettingsOverlay
      v-if="assignmentSettingsOpen"
      :active-attributes="assignmentActiveAttributes"
      @close="closeAssignmentSettingsOverlay"
      @save="onSaveAssignmentSettings"
    />

    <TemplateActivationErrorOverlay
      v-if="templateActivationError"
      :message="templateActivationError"
      @close="templateActivationError = ''"
    />
  </div>
</template>

<style scoped>
.page-manager {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  background-color: var(--color-background-primary);
  font-family: var(--font-family-base);
}

.page-manager__main {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
  padding: 16px 24px 32px;
  box-sizing: border-box;
}

.page-manager-grid-enter-active,
.page-manager-grid-leave-active {
  will-change: opacity, filter;
  transition:
    opacity 0.32s cubic-bezier(0.25, 0.1, 0.25, 1),
    filter 0.32s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.page-manager-grid-enter-from,
.page-manager-grid-leave-to {
  opacity: 0;
  filter: blur(12px);
}

.page-manager-grid-enter-to,
.page-manager-grid-leave-from {
  opacity: 1;
  filter: blur(0);
}

@media (prefers-reduced-motion: reduce) {
  .page-manager-grid-enter-active,
  .page-manager-grid-leave-active {
    transition-duration: 0.12s;
    transition-property: opacity;
  }

  .page-manager-grid-enter-from,
  .page-manager-grid-leave-to {
    filter: none;
  }
}

.page-manager__grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: stretch;
  max-width: var(--layout-header-inner-max-width);
  margin: 0 auto;
}

.page-manager__grid--pages {
  display: grid;
  gap: 15px;
  /* Match PageCard min/max (165px–200px); 1fr stretches columns to full row width */
  grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
}

.page-manager__grid--pages .page-manager__grid-cell--page,
.page-manager__grid--pages .page-manager__grid-cell--folder,
.page-manager__grid--pages .page-manager__grid-cell--back {
  min-width: 0;
}

.page-manager__grid--templates {
  display: grid;
  gap: 10px;
  /* As many ≥350px columns as fit; 1fr stretches them to use full row width */
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

.page-manager__grid--templates .page-manager__grid-cell--template {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.page-manager__grid-cell--template :deep(.job-template-card) {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
}

.page-manager__grid-cell {
  box-sizing: border-box;
  min-width: 0;
}

.page-manager__drop-surface {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.page-manager__grid-cell--page :deep(.page-card) {
  -webkit-user-select: none;
  user-select: none;
}

.page-manager__grid-cell--folder :deep(.page-folder) {
  -webkit-user-select: none;
  user-select: none;
}

.page-manager--marquee-drag {
  user-select: none;
}

.page-manager--flex-drag {
  cursor: grabbing;
}

.page-manager__marquee {
  position: fixed;
  z-index: 50;
  box-sizing: border-box;
  pointer-events: none;
  border: var(--border-width-hairline) solid var(--color-primary);
  border-radius: var(--radius-xs);
  background-color: rgba(52, 125, 255, 0.12);
}

.page-manager__drag-ghost-root {
  transform: translate(-50%, -50%);
  width: 0;
  height: 0;
}

.page-manager__drag-ghost-card {
  position: absolute;
  left: 0;
  top: 0;
  box-sizing: border-box;
  display: flex;
  width: 72px;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: var(--radius-md);
  border: var(--border-width-hairline) solid var(--color-border-light);
  background-color: var(--color-background-primary);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform-origin: 50% 0;
}

.page-manager__drag-ghost-thumb {
  width: 100%;
  aspect-ratio: 199 / 131;
  max-height: 48px;
  border-radius: var(--radius-xs);
  overflow: hidden;
  background-color: var(--color-background-tertiary);
}

.page-manager__drag-ghost-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.page-manager__drag-ghost-title {
  margin: 0;
  max-width: 100%;
  font-family: var(--font-family-base);
  font-size: 10px;
  font-weight: var(--typography-body-font-weight-light);
  line-height: 1.2;
  color: var(--color-text-primary);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .page-manager__drag-ghost-card {
    transform: translate(0, 0) rotate(0deg) !important;
  }
}

.page-manager__context-menu {
  min-width: 180px;
  padding: 5px;
  border-radius: 6px;
  background-color: var(--color-surface-frosted);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
</style>
