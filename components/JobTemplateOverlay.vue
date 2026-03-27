<script setup lang="ts">
/**
 * Full-screen job template editor (teleport). Conflict notice UI kit piece: `components/ui/AlertMessage.vue` (Figma 92:998).
 * Title + TabSwitcher sit in a sticky header; panels scroll beneath. Footer (Cancel / Apply) only on Conditions when tags are dirty; fades in from opacity 0.
 */
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import CloseButton from '@/components/ui/CloseButton.vue'
import TabSwitcher from '@/components/ui/TabSwitcher.vue'
import TagInput from '@/components/ui/TagInput.vue'
import AssignedJob from '@/components/ui/AssignedJob.vue'
import Button from '@/components/ui/Button.vue'
import ContextMenuItem from '@/components/ui/ContextMenuItem.vue'
import AlertMessage from '@/components/ui/AlertMessage.vue'
import {
  getOrthogonalAmbiguityReport,
  wouldBlockTemplateApply,
  ambiguityNoticeParagraphs
} from '@/src/domain/assignJobTemplates.js'

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
  locationValues: string[]
  industryValues: string[]
  companyValues: string[]
  /** When true, Conditions tab is disabled (default template). */
  isDefault?: boolean
  /** When false, this template does not participate in automatic assignment. */
  templateActive?: boolean
}

type TemplateRow = OverlayTemplateModel & Record<string, unknown>

const props = defineProps<{
  template: OverlayTemplateModel
  /** Full template list (same order as app store) for conflict checks */
  templates: TemplateRow[]
  jobs: OverlayJobRow[]
}>()

const emit = defineEmits<{
  close: []
  cancel: []
  apply: [
    payload: {
      locationValues: string[]
      industryValues: string[]
      companyValues: string[]
    }
  ]
}>()

const activeTab = ref(0)

const locationTags = ref<string[]>([])
const industryTags = ref<string[]>([])
const companyTags = ref<string[]>([])

const initialSnapshot = ref('')

function snapshotState () {
  return JSON.stringify({
    l: locationTags.value,
    i: industryTags.value,
    c: companyTags.value
  })
}

function syncDraftFromTemplate () {
  const t = props.template
  locationTags.value = [...(t.locationValues ?? [])]
  industryTags.value = [...(t.industryValues ?? [])]
  companyTags.value = [...(t.companyValues ?? [])]
  initialSnapshot.value = snapshotState()
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

const isDirty = computed(() => snapshotState() !== initialSnapshot.value)

const showConditionsFooter = computed(
  () =>
    activeTab.value === 0 &&
    isDirty.value &&
    !props.template.isDefault
)

const conflictAlertDismissed = ref(false)

watch(
  [locationTags, industryTags, companyTags],
  () => {
    conflictAlertDismissed.value = false
  },
  { deep: true }
)

function buildMergedTemplateList (): object[] {
  return props.templates.map((t) => {
    const base = { ...t }
    if (t.id === props.template.id) {
      return {
        ...base,
        locationValues: [...locationTags.value],
        industryValues: [...industryTags.value],
        companyValues: [...companyTags.value]
      }
    }
    return base
  })
}

const conflictReport = computed(() => {
  if (props.template.isDefault) return null
  const merged = buildMergedTemplateList()
  if (!wouldBlockTemplateApply(props.template.id, merged, props.jobs)) {
    return null
  }
  return getOrthogonalAmbiguityReport(merged, props.jobs)
})

const conflictParagraphs = computed((): string[] | null => {
  if (!conflictReport.value) return null
  return ambiguityNoticeParagraphs(
    conflictReport.value,
    props.template.title
  )
})

const showConflictAlert = computed(
  () =>
    conflictParagraphs.value != null &&
    conflictParagraphs.value.length > 0 &&
    !conflictAlertDismissed.value
)

/** True while current draft conditions would create a blocking assignment conflict. */
const applyChangesDisabled = computed(() => conflictParagraphs.value != null)

const assignedJobsList = computed(() =>
  props.jobs.filter((j) => j.jobTemplate === props.template.title)
)

const jobsScrollRef = ref<HTMLElement | null>(null)
const jobsFadeTop = ref(false)
const jobsFadeBottom = ref(false)
let jobsScrollRo: ResizeObserver | null = null

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

const pickerOpen = ref(false)
const pickerKind = ref<'location' | 'industry' | 'company'>('location')
const pickerRect = ref<DOMRect | null>(null)
const pickerPanelRef = ref<HTMLElement | null>(null)

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

const pickerStyle = computed(() => {
  const r = pickerRect.value
  if (!r) return { display: 'none' }
  const left = Math.max(
    8,
    Math.min(r.left, typeof window !== 'undefined' ? window.innerWidth - 258 : r.left)
  )
  return {
    position: 'fixed' as const,
    top: `${r.bottom + 4}px`,
    left: `${left}px`,
    width: '250px',
    maxHeight: 'min(320px, 40vh)',
    zIndex: 10020
  }
})

function openPicker (
  kind: 'location' | 'industry' | 'company',
  anchor: HTMLElement
) {
  pickerKind.value = kind
  pickerRect.value = anchor.getBoundingClientRect()
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

function onAddLocation (anchor: HTMLElement) {
  openPicker('location', anchor)
}
function onAddIndustry (anchor: HTMLElement) {
  openPicker('industry', anchor)
}
function onAddCompany (anchor: HTMLElement) {
  openPicker('company', anchor)
}

function resetDraft () {
  const s = JSON.parse(initialSnapshot.value) as {
    l: string[]
    i: string[]
    c: string[]
  }
  locationTags.value = s.l
  industryTags.value = s.i
  companyTags.value = s.c
}

function onClose () {
  resetDraft()
  closePicker()
  activeTab.value = 0
  emit('close')
}

function onCancel () {
  resetDraft()
  closePicker()
  emit('cancel')
}

function onApply () {
  if (!isDirty.value) return
  if (!props.template.isDefault) {
    const merged = buildMergedTemplateList()
    if (wouldBlockTemplateApply(props.template.id, merged, props.jobs)) {
      conflictAlertDismissed.value = false
      return
    }
  }
  emit('apply', {
    locationValues: [...locationTags.value],
    industryValues: [...industryTags.value],
    companyValues: [...companyTags.value]
  })
  initialSnapshot.value = snapshotState()
}

function onBackdropPointerDown (e: MouseEvent) {
  if (e.target === e.currentTarget) onClose()
}

function onKeydown (e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (pickerOpen.value) {
      closePicker()
    } else {
      onClose()
    }
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

const pickerScrollCloseOpts: AddEventListenerOptions = { capture: true, passive: true }

function onDocumentScrollClosePicker (e: Event) {
  if (!pickerOpen.value) return
  const target = e.target
  if (target instanceof Node && pickerPanelRef.value?.contains(target)) return
  closePicker()
}

watch(activeTab, () => {
  nextTick(() => {
    updateJobsScrollFades()
    syncJobsScrollObserver()
  })
})

watch(
  assignedJobsList,
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
  nextTick(() => {
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
      <div
        class="job-template-overlay__backdrop"
        aria-hidden="true"
        @pointerdown="onBackdropPointerDown"
      />
      <div
        class="job-template-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="template.title"
      >
        <div class="job-template-overlay__inner">
          <div class="job-template-overlay__scroll">
            <div class="job-template-overlay__sticky-head">
              <header class="job-template-overlay__header">
                <h2 class="job-template-overlay__title">{{ template.title }}</h2>
                <CloseButton aria-label="Close dialog" @click="onClose" />
              </header>
              <TabSwitcher
                v-model="activeTab"
                option-1-label="Conditions"
                option-2-label="Assigned Jobs"
                :option1-disabled="Boolean(template.isDefault)"
                class="job-template-overlay__tabs"
              />
            </div>

            <div class="job-template-overlay__body">
              <div
                v-show="activeTab === 0"
                class="job-template-overlay__panel job-template-overlay__panel--conditions"
              >
                <TagInput
                  v-model="locationTags"
                  variant="location"
                  editable
                  @add="onAddLocation"
                />
                <TagInput
                  v-model="industryTags"
                  variant="industry"
                  editable
                  @add="onAddIndustry"
                />
                <TagInput
                  v-model="companyTags"
                  variant="company"
                  editable
                  @add="onAddCompany"
                />
                <AlertMessage
                  v-if="showConflictAlert"
                  title="Conflicting rules"
                  :paragraphs="conflictParagraphs ?? []"
                  @close="conflictAlertDismissed = true"
                />
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
                    <AssignedJob
                      v-for="job in assignedJobsList"
                      :key="job.id"
                      :job-title="job.jobTitle"
                      :location="job.location"
                      :industry="job.industry"
                      :company="job.company"
                    />
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
                :disabled="applyChangesDisabled"
                @click="onApply"
              >
                Apply changes
              </Button>
            </footer>
          </Transition>
        </div>
      </div>

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
  padding: 25px 25px 25px;
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
  gap: 15px;
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
  gap: 15px;
  flex-shrink: 0;
  padding-bottom: 15px;
  background-color: var(--color-white);
  box-shadow: 0 1px 0 var(--color-border-light);
}

.job-template-overlay__header {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: flex-start;
  gap: 15px;
  flex-shrink: 0;
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
