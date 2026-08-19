<script setup lang="ts">
/**
 * Full-screen job template editor (teleport).
 */
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import CloseButton from '@/components/ui/CloseButton.vue'
import TabSwitcher from '@/components/ui/TabSwitcher.vue'
import TagInput from '@/components/ui/TagInput.vue'
import AssignedJob from '@/components/ui/AssignedJob.vue'
import Button from '@/components/ui/Button.vue'
import ContextMenuItem from '@/components/ui/ContextMenuItem.vue'
import InputField from '@/components/ui/InputField.vue'
import ThumbnailUploader from '@/components/ui/ThumbnailUploader.vue'
import Divider from '@/components/ui/Divider.vue'
import { manualOverrideByJobId } from '@/src/state/jobsAndTemplatesStore.js'

type AssignmentAttribute = 'location' | 'industry' | 'company' | 'title'

export interface OverlayJobRow {
  id: string
  jobTitle: string
  location: string
  industry: string
  company: string
  jobTemplate: string
  active?: boolean
  lastUpdated?: string
}

export interface OverlayTemplateModel {
  id: string
  title: string
  thumbnail?: string
  thumbnailFileName?: string
  locationValues: string[]
  industryValues: string[]
  companyValues: string[]
  titleValues?: string[]
  isDefault?: boolean
  templateActive?: boolean
}

const props = defineProps<{
  template: OverlayTemplateModel
  jobs: OverlayJobRow[]
  activeAttributes: AssignmentAttribute[]
}>()

const emit = defineEmits<{
  close: []
  cancel: []
  apply: [
    payload: {
      locationValues: string[]
      industryValues: string[]
      companyValues: string[]
      titleValues: string[]
    }
  ]
  renameTitle: [title: string]
}>()

const activeTab = ref(0)

const titleDraft = ref('')
const locationTags = ref<string[]>([])
const industryTags = ref<string[]>([])
const companyTags = ref<string[]>([])
const titleTags = ref<string[]>([])

const isEditingHeaderTitle = ref(false)
const headerTitleInputRef = ref<HTMLInputElement | null>(null)

const jobsScrollRef = ref<HTMLElement | null>(null)
const jobsFadeTop = ref(false)
const jobsFadeBottom = ref(false)
let jobsScrollRo: ResizeObserver | null = null

const pickerOpen = ref(false)
const pickerKind = ref<'location' | 'industry' | 'company'>('location')
const pickerRect = ref<DOMRect | null>(null)
const pickerPanelRef = ref<HTMLElement | null>(null)

const initialSnapshot = ref('')

const shellVisible = ref(false)
const pendingShellEmit = ref<'close' | 'cancel' | null>(null)

function snapshotState () {
  return JSON.stringify({
    l: locationTags.value,
    i: industryTags.value,
    c: companyTags.value,
    t: titleTags.value
  })
}

function resetDraft () {
  const s = JSON.parse(initialSnapshot.value) as {
    l: string[]
    i: string[]
    c: string[]
    t: string[]
  }
  locationTags.value = s.l
  industryTags.value = s.i
  companyTags.value = s.c
  titleTags.value = s.t ?? []
}

function syncDraftFromTemplate () {
  const t = props.template
  titleDraft.value = t.title
  locationTags.value = [...(t.locationValues ?? [])]
  industryTags.value = [...(t.industryValues ?? [])]
  companyTags.value = [...(t.companyValues ?? [])]
  titleTags.value = [...(t.titleValues ?? [])]
  initialSnapshot.value = snapshotState()
}

function isAttributeActive (attr: AssignmentAttribute): boolean {
  return props.activeAttributes.includes(attr)
}

function commitTitleDraft () {
  const trimmed = titleDraft.value.trim()
  if (trimmed === '') {
    titleDraft.value = props.template.title
    return
  }
  if (trimmed !== props.template.title) {
    emit('renameTitle', trimmed)
  }
}

function startEditingHeaderTitle () {
  titleDraft.value = props.template.title
  isEditingHeaderTitle.value = true
  void nextTick(() => {
    headerTitleInputRef.value?.focus()
    headerTitleInputRef.value?.select()
  })
}

function saveHeaderTitleEdit () {
  commitTitleDraft()
  isEditingHeaderTitle.value = false
}

function discardHeaderTitleEdit () {
  titleDraft.value = props.template.title
  isEditingHeaderTitle.value = false
}

function onHeaderTitleKeydown (e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    e.stopPropagation()
    saveHeaderTitleEdit()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    discardHeaderTitleEdit()
  } else if (e.key === ' ') {
    e.stopPropagation()
  }
}

const isDirty = computed(() => snapshotState() !== initialSnapshot.value)

const showConditionsFooter = computed(
  () => activeTab.value === 0 && isDirty.value && !props.template.isDefault
)

const assignedJobsPartitioned = computed(() => {
  const title = props.template.title
  const all = props.jobs.filter((j) => j.jobTemplate === title)
  const overrides = manualOverrideByJobId.value

  const manual: OverlayJobRow[] = []
  const auto: OverlayJobRow[] = []
  for (const j of all) {
    if (overrides[j.id] === title) manual.push(j)
    else auto.push(j)
  }
  return { manual, auto }
})

function updateJobsScrollFades () {
  if (activeTab.value !== 1) {
    jobsFadeTop.value = false
    jobsFadeBottom.value = false
    return
  }
  const el = jobsScrollRef.value
  if (!el) {
    jobsFadeTop.value = false
    jobsFadeBottom.value = false
    return
  }
  const { scrollTop, clientHeight, scrollHeight } = el
  const eps = 2
  jobsFadeTop.value = scrollTop > eps
  jobsFadeBottom.value = scrollTop + clientHeight < scrollHeight - eps
}

function syncJobsScrollObserver () {
  jobsScrollRo?.disconnect()
  jobsScrollRo = null
  if (activeTab.value !== 1) return
  const el = jobsScrollRef.value
  if (!el || typeof ResizeObserver === 'undefined') return
  jobsScrollRo = new ResizeObserver(() => {
    updateJobsScrollFades()
  })
  jobsScrollRo.observe(el)
}

const uniqueLocations = computed(() =>
  [...new Set(props.jobs.map((j) => j.location))].sort((a, b) =>
    a.localeCompare(b)
  )
)
const uniqueIndustries = computed(() =>
  [...new Set(props.jobs.map((j) => j.industry))].sort((a, b) =>
    a.localeCompare(b)
  )
)
const uniqueCompanies = computed(() =>
  [...new Set(props.jobs.map((j) => j.company))].sort((a, b) =>
    a.localeCompare(b)
  )
)

const pickerOptions = computed(() => {
  let pool: string[]
  let selected: string[]
  switch (pickerKind.value) {
    case 'industry':
      pool = uniqueIndustries.value
      selected = industryTags.value
      break
    case 'company':
      pool = uniqueCompanies.value
      selected = companyTags.value
      break
    default:
      pool = uniqueLocations.value
      selected = locationTags.value
  }
  return pool.filter((v) => !selected.includes(v))
})

const PICKER_PANEL_W = 250
const PICKER_VIEWPORT_PAD = 8
const PICKER_CURSOR_PAD = 4

const pickerStyle = computed(() => {
  const r = pickerRect.value
  if (!r) return { display: 'none' }
  const vw = typeof window !== 'undefined' ? window.innerWidth : 800
  const vh = typeof window !== 'undefined' ? window.innerHeight : 600
  const approxH = Math.min(320, vh * 0.4)
  const atPoint = r.width === 0 && r.height === 0

  let left: number
  let top: number

  if (atPoint) {
    const cx = r.left
    const cy = r.top
    left = cx + PICKER_CURSOR_PAD
    if (left + PICKER_PANEL_W + PICKER_VIEWPORT_PAD > vw) {
      left = Math.max(
        PICKER_VIEWPORT_PAD,
        cx - PICKER_PANEL_W - PICKER_CURSOR_PAD
      )
    }
    left = Math.max(
      PICKER_VIEWPORT_PAD,
      Math.min(left, vw - PICKER_PANEL_W - PICKER_VIEWPORT_PAD)
    )

    top = cy + PICKER_CURSOR_PAD
    if (top + approxH + PICKER_VIEWPORT_PAD > vh) {
      top = Math.max(
        PICKER_VIEWPORT_PAD,
        cy - approxH - PICKER_CURSOR_PAD
      )
    }
    top = Math.max(PICKER_VIEWPORT_PAD, Math.min(top, vh - PICKER_VIEWPORT_PAD))
  } else {
    left = Math.max(
      PICKER_VIEWPORT_PAD,
      Math.min(r.left, vw - 258)
    )
    top = r.bottom + PICKER_CURSOR_PAD
  }

  return {
    position: 'fixed' as const,
    top: `${top}px`,
    left: `${left}px`,
    width: `${PICKER_PANEL_W}px`,
    maxHeight: 'min(320px, 40vh)',
    zIndex: 10020
  }
})

type PickerAnchor = HTMLElement | { clientX: number; clientY: number }

function openPicker (kind: 'location' | 'industry' | 'company', anchor: PickerAnchor) {
  pickerKind.value = kind
  if (typeof HTMLElement !== 'undefined' && anchor instanceof HTMLElement) {
    pickerRect.value = anchor.getBoundingClientRect()
  } else {
    const { clientX, clientY } = anchor
    pickerRect.value = DOMRect.fromRect({
      x: clientX,
      y: clientY,
      width: 0,
      height: 0
    })
  }
  pickerOpen.value = true
  nextTick(() => {
    pickerPanelRef.value?.querySelector('button')?.focus()
  })
}

function closePicker () {
  pickerOpen.value = false
  pickerRect.value = null
}

function selectPickerOption (value: string) {
  if (pickerKind.value === 'location') {
    locationTags.value = [...locationTags.value, value]
  } else if (pickerKind.value === 'industry') {
    industryTags.value = [...industryTags.value, value]
  } else {
    companyTags.value = [...companyTags.value, value]
  }
  closePicker()
}

function onAddLocation (payload: { clientX: number; clientY: number }) {
  openPicker('location', payload)
}

function onAddIndustry (payload: { clientX: number; clientY: number }) {
  openPicker('industry', payload)
}

function onAddCompany (payload: { clientX: number; clientY: number }) {
  openPicker('company', payload)
}

function onShellAfterLeave () {
  const kind = pendingShellEmit.value
  pendingShellEmit.value = null
  if (kind === 'close') emit('close')
  else if (kind === 'cancel') emit('cancel')
}

function requestShellClose (kind: 'close' | 'cancel') {
  closePicker()
  pendingShellEmit.value = kind
  shellVisible.value = false
}

function onClose () {
  resetDraft()
  activeTab.value = 0
  requestShellClose('close')
}

function onCancel () {
  resetDraft()
  requestShellClose('cancel')
}

function onApply () {
  if (!isDirty.value) return
  emit('apply', {
    locationValues: [...locationTags.value],
    industryValues: [...industryTags.value],
    companyValues: [...companyTags.value],
    titleValues: [...titleTags.value]
  })
  initialSnapshot.value = snapshotState()
}

function onBackdropPointerDown (e: MouseEvent) {
  if (e.target === e.currentTarget) onClose()
}

function onKeydown (e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (pickerOpen.value) closePicker()
    else onClose()
  }
}

function onDocPointerDown (e: MouseEvent) {
  if (!pickerOpen.value) return
  const el = e.target as Node
  if (pickerPanelRef.value?.contains(el)) return
  const t = e.target as HTMLElement
  if (t.closest?.('.add-button')) return
  closePicker()
}

const pickerScrollCloseOpts: AddEventListenerOptions = {
  capture: true,
  passive: true
}

function onDocumentScrollClosePicker (e: Event) {
  if (!pickerOpen.value) return
  const target = e.target
  if (target instanceof Node && pickerPanelRef.value?.contains(target)) return
  closePicker()
}

watch(
  () => props.template,
  () => syncDraftFromTemplate(),
  { deep: true, immediate: true }
)

watch(
  () => props.template.isDefault,
  (isDef) => {
    if (isDef) activeTab.value = 1
  },
  { immediate: true }
)

watch(
  () => props.template.id,
  () => {
    isEditingHeaderTitle.value = false
  }
)

watch(activeTab, () => {
  nextTick(() => {
    updateJobsScrollFades()
    syncJobsScrollObserver()
  })
})

watch(
  assignedJobsPartitioned,
  () => {
    nextTick(() => {
      updateJobsScrollFades()
    })
  },
  { deep: true }
)

watch(
  () => props.template.title,
  () => {
    nextTick(() => {
      updateJobsScrollFades()
    })
  }
)

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('pointerdown', onDocPointerDown, true)
  document.addEventListener('scroll', onDocumentScrollClosePicker, pickerScrollCloseOpts)
  void nextTick(() => {
    shellVisible.value = true
    updateJobsScrollFades()
    syncJobsScrollObserver()
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('pointerdown', onDocPointerDown, true)
  document.removeEventListener('scroll', onDocumentScrollClosePicker, pickerScrollCloseOpts)
  jobsScrollRo?.disconnect()
  jobsScrollRo = null
})
</script>

<template>
  <Teleport to="body">
    <div class="job-template-overlay-root">
      <Transition name="job-template-overlay-backdrop">
        <div
          v-if="shellVisible"
          class="job-template-overlay__backdrop"
          aria-hidden="true"
          @pointerdown="onBackdropPointerDown"
        />
      </Transition>
      <Transition name="job-template-overlay-panel" @after-leave="onShellAfterLeave">
        <div
          v-if="shellVisible"
          class="job-template-overlay"
          role="dialog"
          aria-modal="true"
          :aria-label="template.title"
        >
        <div class="job-template-overlay__inner">
          <div
            class="job-template-overlay__scroll"
          >
            <div class="job-template-overlay__sticky-head">
              <header class="job-template-overlay__header">
                <h2
                  v-if="!isEditingHeaderTitle"
                  class="job-template-overlay__title job-template-overlay__title--clickable"
                  role="button"
                  tabindex="0"
                  :aria-label="`Template name: ${template.title}. Click to rename.`"
                  @click="startEditingHeaderTitle"
                  @keydown.enter.prevent="startEditingHeaderTitle"
                  @keydown.space.prevent="startEditingHeaderTitle"
                >
                  {{ template.title }}
                </h2>
                <input
                  v-else
                  ref="headerTitleInputRef"
                  v-model="titleDraft"
                  type="text"
                  class="job-template-overlay__title job-template-overlay__title-input"
                  autocomplete="off"
                  aria-label="Template name"
                  @blur="saveHeaderTitleEdit"
                  @keydown="onHeaderTitleKeydown"
                  @click.stop
                />
                <CloseButton aria-label="Close dialog" @click="onClose" />
              </header>
              <TabSwitcher
                v-model="activeTab"
                option-1-label="Conditions"
                option-2-label="Assigned Jobs"
                option-3-label="Overview"
                :option1-disabled="Boolean(template.isDefault)"
                class="job-template-overlay__tabs"
              />
            </div>

            <div class="job-template-overlay__body">
              <p
                v-show="activeTab === 0"
                class="job-template-overlay__conditions-intro"
              >
                Set rules for active assignment attributes. Jobs that match are assigned to this template automatically.
              </p>
              <div
                v-show="activeTab === 0"
                class="job-template-overlay__panel job-template-overlay__panel--conditions"
              >
                <div
                  v-if="isAttributeActive('location')"
                  class="job-template-overlay__condition-row"
                >
                  <TagInput
                    v-model="locationTags"
                    variant="location"
                    editable
                    @add="onAddLocation"
                  />
                </div>
                <div
                  v-if="isAttributeActive('industry')"
                  class="job-template-overlay__condition-row"
                >
                  <TagInput
                    v-model="industryTags"
                    variant="industry"
                    editable
                    @add="onAddIndustry"
                  />
                </div>
                <div
                  v-if="isAttributeActive('company')"
                  class="job-template-overlay__condition-row"
                >
                  <TagInput
                    v-model="companyTags"
                    variant="company"
                    editable
                    @add="onAddCompany"
                  />
                </div>
                <div
                  v-if="isAttributeActive('title')"
                  class="job-template-overlay__condition-row"
                >
                  <TagInput
                    v-model="titleTags"
                    variant="title"
                    editable
                  />
                </div>
              </div>

              <div
                v-show="activeTab === 1"
                class="job-template-overlay__panel job-template-overlay__panel--jobs"
              >
                <div class="job-template-overlay__jobs-scroll-shell">
                  <div
                    ref="jobsScrollRef"
                    class="job-template-overlay__jobs-scroll"
                    @scroll="updateJobsScrollFades"
                  >
                    <div
                      v-if="assignedJobsPartitioned.manual.length > 0"
                      class="job-template-overlay__jobs-section"
                    >
                      <Divider
                        class="job-template-overlay__jobs-divider"
                        label="Manual"
                      />
                      <div class="job-template-overlay__jobs-group">
                        <div
                          class="job-template-overlay__jobs-group-fade"
                          aria-hidden="true"
                        />
                        <AssignedJob
                          v-for="job in assignedJobsPartitioned.manual"
                          :key="job.id"
                          :job-title="job.jobTitle"
                          :location="job.location"
                          :industry="job.industry"
                          :company="job.company"
                        />
                      </div>
                    </div>
                    <div
                      v-if="assignedJobsPartitioned.auto.length > 0"
                      class="job-template-overlay__jobs-section"
                    >
                      <Divider
                        class="job-template-overlay__jobs-divider"
                        label="Auto"
                      />
                      <div class="job-template-overlay__jobs-group">
                        <div
                          class="job-template-overlay__jobs-group-fade"
                          aria-hidden="true"
                        />
                        <AssignedJob
                          v-for="job in assignedJobsPartitioned.auto"
                          :key="job.id"
                          :job-title="job.jobTitle"
                          :location="job.location"
                          :industry="job.industry"
                          :company="job.company"
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    class="job-template-overlay__jobs-fade job-template-overlay__jobs-fade--top"
                    :class="{
                      'job-template-overlay__jobs-fade--visible': jobsFadeTop
                    }"
                    aria-hidden="true"
                  />
                  <div
                    class="job-template-overlay__jobs-fade job-template-overlay__jobs-fade--bottom"
                    :class="{
                      'job-template-overlay__jobs-fade--visible': jobsFadeBottom
                    }"
                    aria-hidden="true"
                  />
                </div>
              </div>

              <div
                v-show="activeTab === 2"
                class="job-template-overlay__panel job-template-overlay__panel--overview"
              >
                <InputField
                  v-model="titleDraft"
                  label="Template Name"
                  :placeholder="template.title"
                  autocomplete="off"
                  @blur="commitTitleDraft"
                />
                <ThumbnailUploader
                  :template-id="template.id"
                  :image-url="template.thumbnail ?? ''"
                  :file-name="template.thumbnailFileName ?? ''"
                />
              </div>
            </div>
          </div>

          <Transition name="job-template-overlay-footer">
            <footer
              v-if="showConditionsFooter"
              class="job-template-overlay__footer"
            >
              <Button
                variant="default"
                class="job-template-overlay__action"
                @click="onCancel"
              >
                Cancel
              </Button>
              <Button
                variant="accent"
                class="job-template-overlay__action"
                @click="onApply"
              >
                Apply changes
              </Button>
            </footer>
          </Transition>
        </div>
        </div>
      </Transition>

      <div
        v-show="pickerOpen"
        ref="pickerPanelRef"
        class="job-template-overlay__picker context-menu"
        role="menu"
        :aria-label="`Pick ${pickerKind} value`"
        :style="pickerStyle"
      >
        <template v-if="pickerOptions.length > 0">
          <ContextMenuItem
            v-for="opt in pickerOptions"
            :key="opt"
            :label="opt"
            @click="selectPickerOption(opt)"
          />
        </template>
        <p v-else class="job-template-overlay__picker-empty">
          No more values
        </p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.job-template-overlay-root {
  position: fixed;
  inset: 0;
  z-index: 10010;
  pointer-events: none;
}

/* Same motion as `ContextMenuItem.vue` `.context-menu` (opacity + scale, 0.22s ease). */
.job-template-overlay-backdrop-enter-active,
.job-template-overlay-backdrop-leave-active {
  transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.job-template-overlay-backdrop-enter-from,
.job-template-overlay-backdrop-leave-to {
  opacity: 0;
}

.job-template-overlay-panel-enter-active,
.job-template-overlay-panel-leave-active {
  transition:
    opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.job-template-overlay-panel-enter-from,
.job-template-overlay-panel-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .job-template-overlay-backdrop-enter-active,
  .job-template-overlay-backdrop-leave-active,
  .job-template-overlay-panel-enter-active,
  .job-template-overlay-panel-leave-active {
    transition: none;
  }

  .job-template-overlay-backdrop-enter-from,
  .job-template-overlay-backdrop-leave-to {
    opacity: 1;
  }

  .job-template-overlay-panel-enter-from,
  .job-template-overlay-panel-leave-to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

.job-template-overlay__backdrop {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.35);
  pointer-events: auto;
}

.job-template-overlay {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: min(726px, calc(100vw - 48px));
  height: 80vh;
  max-height: 700px;
  padding: 40px;
  border-radius: 25px;
  background-color: var(--color-white);
  box-shadow: 0 7px 22px 0 rgba(0, 0, 0, 0.25);
  font-family: var(--font-family-base);
  pointer-events: auto;
  overflow: hidden;
}

.job-template-overlay__inner {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  gap: 15px;
  min-height: 0;
  min-width: 0;
}

.job-template-overlay__scroll {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  gap: 30px;
  min-height: 0;
  min-width: 0;
  overflow: auto;
}

.job-template-overlay__sticky-head {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0;
  flex-shrink: 0;
  padding-bottom: 0;
  background-color: var(--color-white);
}

.job-template-overlay__header {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: flex-start;
  gap: 15px;
  flex-shrink: 0;
  height: fit-content;
  margin-bottom: 15px;
}

.job-template-overlay__title {
  flex: 1 1 0;
  margin: 0;
  min-width: 0;
  font-size: var(--typography-title-1-font-size);
  font-weight: var(--typography-title-1-font-weight-strong);
  line-height: var(--typography-title-1-line-height);
  letter-spacing: var(--typography-title-1-letter-spacing);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.job-template-overlay__title--clickable {
  cursor: pointer;
}

.job-template-overlay__title--clickable:focus-visible {
  outline: none;
  border-radius: 4px;
  box-shadow: 0 0 0 2px var(--color-focus-ring);
}

.job-template-overlay__title-input {
  box-sizing: border-box;
  width: 100%;
  padding: 0;
  border: none;
  border-radius: 0;
  background-color: var(--color-white);
  font-family: var(--font-family-base);
}

.job-template-overlay__title-input:focus,
.job-template-overlay__title-input:focus-visible {
  outline: none;
  box-shadow: none;
  border: none;
}

.job-template-overlay__body {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: stretch;
  width: 100%;
  min-width: 0;
  flex: 1 1 auto;
  min-height: 0;
}

.job-template-overlay__conditions-intro {
  margin: 0;
  max-width: 100%;
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-tertiary);
}

.job-template-overlay__tabs {
  flex-shrink: 0;
  width: 100%;
}

.job-template-overlay__panel {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: flex-start;
  width: 100%;
  min-width: 0;
}

.job-template-overlay__panel--conditions {
  flex: 0 1 auto;
}

.job-template-overlay__condition-row {
  width: 100%;
  min-width: 0;
}

.job-template-overlay__conflict-flyout {
  pointer-events: auto;
}

.job-template-overlay__panel--overview {
  flex: 0 1 auto;
  align-items: stretch;
}

.job-template-overlay__panel--jobs {
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.job-template-overlay__jobs-scroll-shell {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
}

.job-template-overlay__jobs-scroll {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: auto;
  padding: 0;
  scrollbar-width: none;
}

.job-template-overlay__jobs-section {
  --job-template-overlay-divider-block-height: calc(
    var(--space-md) + var(--typography-divider-label-line-height) +
      var(--space-md) + var(--border-width-hairline)
  );
  display: flex;
  flex-direction: column;
  gap: 0px;
  align-items: stretch;
  min-width: 0;
}

/**
 * Sticky within the jobs scroller: stays at the top until every job in this
 * section has scrolled past (section is the sticky containing block).
 */
.job-template-overlay__jobs-divider {
  position: sticky;
  top: 0;
  z-index: 3;
  background-color: var(--color-white);
}

/** Jobs under the divider + white fade so rows soften into the header strip */
.job-template-overlay__jobs-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
  position: relative;
  min-width: 0;
}

/**
 * Sticky just under the divider row: white at top fading down so scrolling
 * cards appear to dissolve below the section label.
 */
.job-template-overlay__jobs-group-fade {
  position: sticky;
  top: var(--job-template-overlay-divider-block-height);
  flex-shrink: 0;
  height: 20px;
  margin-bottom: -20px;
  z-index: 2;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    var(--color-white) 0%,
    rgba(255, 255, 255, 0) 100%
  );
}

.job-template-overlay__jobs-scroll::-webkit-scrollbar {
  display: none;
}

.job-template-overlay__jobs-fade {
  position: absolute;
  left: 0;
  right: 0;
  height: 30px;
  pointer-events: none;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.job-template-overlay__jobs-fade--visible {
  opacity: 1;
}

.job-template-overlay__jobs-fade--top {
  top: 0;
  background: linear-gradient(to bottom, var(--color-white), transparent);
}

.job-template-overlay__jobs-fade--bottom {
  bottom: 0;
  background: linear-gradient(to top, var(--color-white), transparent);
}

.job-template-overlay-footer-enter-active,
.job-template-overlay-footer-leave-active {
  transition: opacity 0.25s ease;
}

.job-template-overlay-footer-enter-from,
.job-template-overlay-footer-leave-to {
  opacity: 0;
}

.job-template-overlay__footer {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: 10px;
  width: 100%;
  flex-shrink: 0;
  min-height: 28px;
}

.job-template-overlay__action {
  flex: 1 1 0;
  min-width: 0;
  width: 100%;
}

.job-template-overlay__picker {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 3px;
  padding: 5px;
  border-radius: 6px;
  border: none;
  background-color: rgba(255, 255, 255, 0.8);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  box-shadow: 0 7px 22px 0 rgba(0, 0, 0, 0.25);
  overflow-y: auto;
  pointer-events: auto;
}

.job-template-overlay__picker-empty {
  margin: 0;
  padding: 8px;
  font-size: var(--typography-body-font-size);
  color: var(--color-text-tertiary);
}
</style>
