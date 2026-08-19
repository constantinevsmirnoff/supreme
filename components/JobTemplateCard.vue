<script setup lang="ts">
/**
 * Job template card — Figma: Page Template Card (node 58:6093)
 * Default template: focus-colored border in all states; hover uses same drop shadow as other cards; “Default” label primary.
 * Default-template pills: full ConditionPill styling at 30% opacity (not inactive variant); empty conditions show “Any condition”.
 * Non-default: optional assignment status row (Figma 88:537) — dot + Active/Inactive label.
 */
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import ThreeDotMenu from '@/components/ui/ThreeDotMenu.vue'
import ConditionPill from '@/components/ui/ConditionPill.vue'
import Status from '@/components/ui/Status.vue'
import ContextMenuItem from '@/components/ui/ContextMenuItem.vue'

const MENU_ITEMS = [
  { id: 'rename', label: 'Rename' },
  { id: 'activate', label: 'Activate' },
  { id: 'deactivate', label: 'Deactivate' },
  { id: 'duplicate', label: 'Duplicate' },
  { id: 'delete', label: 'Delete' }
] as const

const props = withDefaults(
  defineProps<{
    title?: string
    jobsSummary?: string
    /** When true, shows a “Default” line under the assignment summary */
    isDefault?: boolean
    /** Condition lines for pills; rows with no non-empty values are hidden */
    locationValues?: string[]
    industryValues?: string[]
    companyValues?: string[]
    titleValues?: string[]
    /** Optional preview image URL */
    thumbnailSrc?: string
    thumbnailAlt?: string
    /** When true, card opens template editor (Page Manager); menu click does not propagate */
    interactive?: boolean
    /** Muted condition pills (e.g. default template on Page Manager) */
    inactiveConditionPills?: boolean
    /**
     * Non-default cards: status row shows Active (true) or Inactive (false).
     * Omit for default cards or showcase; when omitted on non-default, status row is hidden.
     */
    assignmentActive?: boolean
    /**
     * When false, template is inactive (excluded from auto-assignment).
     * Used to disable Activate/Deactivate menu options; default templates ignore this.
     */
    templateActive?: boolean
    /** Globally active assignment attributes; inactive attributes should not be shown as pills. */
    activeAttributes?: Array<'location' | 'industry' | 'company' | 'title'>
  }>(),
  {
    title: 'Frankfurt Finance Jobs / O&B',
    jobsSummary: '15 jobs',
    isDefault: false,
    thumbnailSrc: '',
    thumbnailAlt: 'Job page template preview',
    interactive: false,
    inactiveConditionPills: false,
    locationValues: () => [],
    industryValues: () => [],
    companyValues: () => [],
    titleValues: () => [],
    activeAttributes: () => ['location', 'industry', 'company', 'title']
  }
)

const emit = defineEmits<{
  open: []
  'update:title': [value: string]
  'set-template-active': [active: boolean]
  duplicate: []
  delete: []
}>()

const contextMenuOpen = ref(false)
const contextMenuPanelRef = ref<HTMLElement | null>(null)
const menuAnchorRef = ref<HTMLElement | null>(null)
const contextMenuStyle = ref<Record<string, string>>({})

const isEditingTitle = ref(false)
const editedTitle = ref('')
const titleInputRef = ref<HTMLInputElement | null>(null)
const mainBlockRef = ref<HTMLElement | null>(null)
/** Drives thumb frame height to match `.job-template-card__main` (16:9 width derived in CSS). */
const mainBlockHeightPx = ref(80)

let mainBlockResizeObserver: ResizeObserver | null = null

function syncMainBlockHeight () {
  const el = mainBlockRef.value
  if (!el) return
  mainBlockHeightPx.value = Math.round(el.getBoundingClientRect().height)
}

const scrollCloseOpts: AddEventListenerOptions = { capture: true, passive: true }

function onDocumentScrollCloseContextMenu (e: Event) {
  if (!contextMenuOpen.value) return
  const target = e.target
  if (target instanceof Node && contextMenuPanelRef.value?.contains(target)) return
  if (target instanceof Node && menuAnchorRef.value?.contains(target)) return
  contextMenuOpen.value = false
}

function onDocumentPointerDownContextMenu (e: MouseEvent) {
  if (!contextMenuOpen.value) return
  const t = e.target as Node
  if (contextMenuPanelRef.value?.contains(t)) return
  if (menuAnchorRef.value?.contains(t)) return
  contextMenuOpen.value = false
}

function onDocumentKeydownContextMenu (e: KeyboardEvent) {
  if (e.key === 'Escape' && contextMenuOpen.value && !isEditingTitle.value) {
    contextMenuOpen.value = false
  }
}

watch(contextMenuOpen, (open) => {
  if (!open) {
    document.removeEventListener('scroll', onDocumentScrollCloseContextMenu, scrollCloseOpts)
    document.removeEventListener('pointerdown', onDocumentPointerDownContextMenu, true)
    document.removeEventListener('keydown', onDocumentKeydownContextMenu, true)
    return
  }
  updateContextMenuPosition()
  document.addEventListener('scroll', onDocumentScrollCloseContextMenu, scrollCloseOpts)
  document.addEventListener('pointerdown', onDocumentPointerDownContextMenu, true)
  document.addEventListener('keydown', onDocumentKeydownContextMenu, true)
  nextTick(() => contextMenuPanelRef.value?.querySelector('button')?.focus())
})

onMounted(() => {
  nextTick(() => {
    syncMainBlockHeight()
    const el = mainBlockRef.value
    if (!el || typeof ResizeObserver === 'undefined') return
    mainBlockResizeObserver = new ResizeObserver(() => syncMainBlockHeight())
    mainBlockResizeObserver.observe(el)
  })
})

onBeforeUnmount(() => {
  mainBlockResizeObserver?.disconnect()
  mainBlockResizeObserver = null
  document.removeEventListener('scroll', onDocumentScrollCloseContextMenu, scrollCloseOpts)
  document.removeEventListener('pointerdown', onDocumentPointerDownContextMenu, true)
  document.removeEventListener('keydown', onDocumentKeydownContextMenu, true)
})

function updateContextMenuPosition () {
  const el = menuAnchorRef.value
  if (!el || typeof window === 'undefined') return
  const r = el.getBoundingClientRect()
  contextMenuStyle.value = {
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: `${r.bottom + 4}px`,
    left: `${Math.max(8, Math.min(r.left, window.innerWidth - 200))}px`,
    minWidth: '160px',
    zIndex: '10050'
  }
}

function onMenuButtonClick () {
  if (!props.interactive) return
  contextMenuOpen.value = !contextMenuOpen.value
}

function onContextItemClick (item: { id: string; label: string; disabled?: boolean }) {
  if (item.disabled) return
  if (item.id === 'rename') {
    contextMenuOpen.value = false
    startEditingTitle()
  } else if (item.id === 'activate') {
    contextMenuOpen.value = false
    emit('set-template-active', true)
  } else if (item.id === 'deactivate') {
    contextMenuOpen.value = false
    emit('set-template-active', false)
  } else if (item.id === 'duplicate') {
    contextMenuOpen.value = false
    emit('duplicate')
  } else if (item.id === 'delete') {
    contextMenuOpen.value = false
    emit('delete')
  }
}

function startEditingTitle () {
  editedTitle.value = props.title ?? ''
  isEditingTitle.value = true
  nextTick(() => {
    titleInputRef.value?.focus()
    titleInputRef.value?.select()
  })
}

function saveTitleEdit () {
  const trimmed = editedTitle.value.trim()
  if (trimmed !== (props.title ?? '')) {
    emit('update:title', trimmed)
  }
  isEditingTitle.value = false
}

function discardTitleEdit () {
  editedTitle.value = props.title ?? ''
  isEditingTitle.value = false
}

function onTitleInputKeydown (e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    e.stopPropagation()
    saveTitleEdit()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    discardTitleEdit()
  } else if (e.key === ' ') {
    e.stopPropagation()
  }
}

function onActivate () {
  if (!props.interactive) return
  emit('open')
}

function onCardKeydown (e: KeyboardEvent) {
  if (!props.interactive) return
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    emit('open')
  }
}

function nonemptyConditionValues (values: string[] | undefined): string[] {
  return (values ?? []).filter((v) => String(v).trim().length > 0)
}

const locationPillValues = computed(() => nonemptyConditionValues(props.locationValues))
const industryPillValues = computed(() => nonemptyConditionValues(props.industryValues))
const companyPillValues = computed(() => nonemptyConditionValues(props.companyValues))
const titlePillValues = computed(() => nonemptyConditionValues(props.titleValues))

const activeAttributeSet = computed(
  () => new Set(props.activeAttributes ?? [])
)

const locationPillVisible = computed(
  () =>
    activeAttributeSet.value.has('location') &&
    locationPillValues.value.length > 0
)
const industryPillVisible = computed(
  () =>
    activeAttributeSet.value.has('industry') &&
    industryPillValues.value.length > 0
)
const companyPillVisible = computed(
  () =>
    activeAttributeSet.value.has('company') &&
    companyPillValues.value.length > 0
)
const titlePillVisible = computed(
  () =>
    activeAttributeSet.value.has('title') &&
    titlePillValues.value.length > 0
)

/** Default page template uses active pills + card-level opacity; others use `inactive` when requested */
const pillInactive = computed(() =>
  props.isDefault ? false : props.inactiveConditionPills
)

const hasAnyConditionPills = computed(
  () =>
    locationPillVisible.value ||
    industryPillVisible.value ||
    companyPillVisible.value ||
    titlePillVisible.value
)

/** Default homepage template with no filters: show a single “Any condition” pill */
const showDefaultAnyConditionPill = computed(
  () =>
    props.isDefault &&
    (props.activeAttributes?.length ?? 0) > 0 &&
    !hasAnyConditionPills.value
)

const showAssignmentStatus = computed(
  () => !props.isDefault && props.assignmentActive !== undefined
)

/** Template participates in auto-assignment (false only when explicitly inactive). */
const templateIsActive = computed(() => props.templateActive !== false)

const activateDisabled = computed(
  () => props.isDefault || templateIsActive.value
)
const deactivateDisabled = computed(
  () => props.isDefault || !templateIsActive.value
)

const contextMenuItems = computed(() =>
  MENU_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    disabled:
      item.id === 'activate'
        ? activateDisabled.value
        : item.id === 'deactivate'
          ? deactivateDisabled.value
          : item.id === 'duplicate' || item.id === 'delete'
            ? props.isDefault
            : false
  }))
)
</script>

<template>
  <article
    class="job-template-card"
    :class="{
      'job-template-card--interactive': interactive,
      'job-template-card--default': isDefault
    }"
    :style="{ '--job-template-thumb-h': `${mainBlockHeightPx}px` }"
    :role="interactive ? 'button' : 'article'"
    :tabindex="interactive ? 0 : undefined"
    :aria-label="interactive ? `Edit job template: ${title}` : undefined"
    @click="onActivate"
    @keydown="onCardKeydown"
  >
    <div class="job-template-card__top">
      <div class="job-template-card__thumb-wrap">
        <div class="job-template-card__thumb">
          <img
            v-if="thumbnailSrc"
            class="job-template-card__thumb-img"
            :src="thumbnailSrc"
            :alt="thumbnailAlt"
          >
          <div
            v-else
            class="job-template-card__thumb-placeholder"
            role="img"
            :aria-label="thumbnailAlt"
          />
        </div>
      </div>
      <div class="job-template-card__main-column">
        <div ref="mainBlockRef" class="job-template-card__main">
          <div class="job-template-card__title-row">
            <input
              v-if="isEditingTitle"
              ref="titleInputRef"
              v-model="editedTitle"
              type="text"
              class="job-template-card__title job-template-card__title-input"
              @blur="saveTitleEdit"
              @keydown="onTitleInputKeydown"
              @click.stop
            >
            <h2 v-else class="job-template-card__title">{{ title }}</h2>
            <div
              ref="menuAnchorRef"
              class="job-template-card__menu"
              @click.stop="onMenuButtonClick"
            >
              <ThreeDotMenu />
            </div>
          </div>
          <div class="job-template-card__meta">
            <p v-if="isDefault" class="job-template-card__default">Default</p>
            <div
              v-if="!isDefault && showAssignmentStatus"
              class="job-template-card__assignment-status"
              role="status"
              :class="assignmentActive
                ? 'job-template-card__assignment-status--active'
                : 'job-template-card__assignment-status--inactive'"
            >
              <span class="job-template-card__status-dot-wrap" aria-hidden="true">
                <Status :active="assignmentActive" />
              </span>
              <p class="job-template-card__status-label">
                {{ assignmentActive ? 'Active' : 'Inactive' }}
              </p>
            </div>
            <span
              v-if="isDefault || showAssignmentStatus"
              class="job-template-card__meta-divider"
              aria-hidden="true"
            />
            <p class="job-template-card__summary">{{ jobsSummary }}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="job-template-card__pills">
      <div v-if="showDefaultAnyConditionPill" class="job-template-card__pill-slot">
        <ConditionPill variant="template" label="Any condition" :inactive="pillInactive" />
      </div>
      <div v-if="locationPillVisible" class="job-template-card__pill-slot">
        <ConditionPill variant="location" :values="locationPillValues" :inactive="pillInactive" />
      </div>
      <div v-if="industryPillVisible" class="job-template-card__pill-slot">
        <ConditionPill variant="industry" :values="industryPillValues" :inactive="pillInactive" />
      </div>
      <div v-if="companyPillVisible" class="job-template-card__pill-slot">
        <ConditionPill variant="company" :values="companyPillValues" :inactive="pillInactive" />
      </div>
      <div v-if="titlePillVisible" class="job-template-card__pill-slot">
        <ConditionPill variant="title" :values="titlePillValues" :inactive="pillInactive" />
      </div>
    </div>
  </article>

  <Teleport to="body">
    <div
      v-show="contextMenuOpen"
      ref="contextMenuPanelRef"
      class="job-template-card__context-menu context-menu"
      role="menu"
      aria-label="Job template options"
      :style="contextMenuStyle"
    >
      <ContextMenuItem
        v-for="item in contextMenuItems"
        :key="item.id"
        :label="item.label"
        :disabled="item.disabled"
        @click="() => onContextItemClick(item)"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.job-template-card {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  width: 100%;
  min-width: 350px;
  padding: 10px;
  border: 1px solid var(--color-border-strong);
  border-radius: 5px;
  background-color: var(--color-background-primary);
  box-shadow: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.job-template-card:not(.job-template-card--default):hover {
  box-shadow: 0 2px 8px 4px rgba(0, 0, 0, 0.05);
}

/* Default template card: focus border always; same hover shadow as other cards */
.job-template-card--default {
  border-color: var(--color-focus-ring);
}

.job-template-card--default:hover {
  box-shadow: 0 2px 8px 4px rgba(0, 0, 0, 0.05);
}

.job-template-card--interactive {
  cursor: pointer;
}

.job-template-card--interactive:focus {
  outline: none;
}

.job-template-card--interactive:focus-visible {
  box-shadow: 0 0 0 2px var(--color-focus-ring);
}

.job-template-card__top {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 15px;
  width: 100%;
}

.job-template-card__main-column {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  align-self: flex-start;
  min-width: 0;
  width: 100%;
}

.job-template-card__thumb-wrap {
  display: flex;
  flex-direction: column;
  align-self: flex-start;
  flex-shrink: 0;
  box-sizing: border-box;
  width: auto;
  min-height: 0;
}

.job-template-card__thumb {
  position: relative;
  box-sizing: border-box;
  flex-shrink: 0;
  height: var(--job-template-thumb-h, 80px);
  width: auto;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--color-border-light);
  border-radius: 5px;
  overflow: hidden;
}

.job-template-card__thumb-img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 5px;
}

.job-template-card__thumb-placeholder {
  position: absolute;
  inset: 0;
  height: 100%;
  border-radius: 5px;
  background-color: var(--color-background-tertiary);
}

.job-template-card__main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: fit-content;
}

.job-template-card__title-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 15px;
  width: 100%;
}

.job-template-card__title {
  flex: 1 1 0;
  margin: 0;
  min-width: 0;
  font-family: var(--font-family-base);
  font-size: var(--typography-title-3-font-size);
  font-weight: var(--typography-title-3-font-weight-strong);
  line-height: var(--typography-title-3-line-height);
  letter-spacing: var(--typography-title-3-letter-spacing);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.job-template-card__title-input {
  box-sizing: border-box;
  width: 100%;
  padding: 0;
  border: 1px solid var(--color-focus-ring);
  border-radius: 4px;
  background-color: var(--color-white);
}

.job-template-card__title-input:focus {
  outline: none;
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

.job-template-card__menu {
  display: inline-flex;
  flex-shrink: 0;
}

.job-template-card__meta {
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
}

.job-template-card__meta-divider {
  width: 1px;
  height: 15px;
  background-color: var(--color-border-strong);
  flex-shrink: 0;
}

.job-template-card__summary,
.job-template-card__default,
.job-template-card__status-label {
  margin: 0;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
}

.job-template-card__summary {
  box-sizing: border-box;
  padding: 0;
  color: var(--color-text-tertiary);
  white-space: normal;
  overflow-wrap: anywhere;
}

.job-template-card__default {
  box-sizing: border-box;
  padding: 0;
  background-color: unset;
}

.job-template-card--default .job-template-card__default {
  color: var(--color-text-tertiary);
}

.job-template-card__assignment-status {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 6px;
  width: auto;
  min-width: 0;
}

.job-template-card__status-dot-wrap {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}

.job-template-card__assignment-status .job-template-card__status-label {
  color: var(--color-text-tertiary);
}

.job-template-card__assignment-status--active {
  box-sizing: border-box;
  align-self: flex-start;
  padding: 0;
  background-color: transparent;
}

.job-template-card__pills {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-start;
  align-items: flex-start;
  align-content: flex-start;
  align-self: stretch;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  flex: 1 1 auto;
  min-height: 0;
}

.job-template-card__pill-slot {
  box-sizing: border-box;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
}

.job-template-card__pill-slot :deep(.condition-pill) {
  box-sizing: border-box;
  max-width: 100%;
}

/* Default template: standard ConditionPill look, 30% opacity (UI Kit) */
.job-template-card--default .job-template-card__pill-slot :deep(.condition-pill) {
  opacity: 0.3;
}

.job-template-card__context-menu {
  flex-direction: column;
  gap: 3px;
  min-width: 160px;
  padding: 5px;
  box-sizing: border-box;
  border-radius: 6px;
  border: none;
  background-color: rgba(255, 255, 255, 0.8);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  box-shadow: 0 7px 22px 0 rgba(0, 0, 0, 0.25);
  pointer-events: auto;
  overflow-y: auto;
}
</style>
