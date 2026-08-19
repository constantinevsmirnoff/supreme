<script setup lang="ts">
/**
 * Job Card — Figma: JobCard (node 6:1544)
 * States: Default, Hover, Selected (Checked).
 * Checkbox visible on Hover + Selected; PromoteButton visible only on Hover.
 * No layout shift: left and right columns reserve fixed space.
 * Right-click: context menu (Select all / Deselect all; Switch template → submenu) when used in Job List.
 */
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import DropdownSelector from '@/components/ui/DropdownSelector.vue'
import { TEMPLATE_DROPDOWN_AUTO_VALUE } from '@/src/state/jobsAndTemplatesStore.js'
import Checkbox from '@/components/ui/Checkbox.vue'
import Status from '@/components/ui/Status.vue'
import LastUpdated from '@/components/ui/LastUpdated.vue'
import ThreeDotMenu from '@/components/ui/ThreeDotMenu.vue'
import PromoteButton from '@/components/ui/PromoteButton.vue'
import ContextMenuItem from '@/components/ui/ContextMenuItem.vue'
import triangleArrowUrl from '@/icons/triangle_arrow.svg?url'

export interface Job {
  id: string
  jobTitle: string
  location: string
  industry: string
  company: string
  jobTemplate: string
  active: boolean
  lastUpdated: string
}

const props = withDefaults(
  defineProps<{
    job: Job
    /** Template titles for manual assignment (Job List); empty = readonly label */
    templateOptions?: string[]
    /** Controlled selection (Job List). Omit for standalone showcase — internal state is used. */
    selected?: boolean
    /** Job List: true when template is auto-assigned (press-hold to unlock dropdown). */
    assignmentLocked?: boolean
  }>(),
  { templateOptions: () => [], assignmentLocked: false }
)

const emit = defineEmits<{
  'select-template': [title: string]
  /** Manual template apply from context menu (bulk applies in Job List when selection is non-empty). */
  'switch-template': [title: string]
  'update:selected': [value: boolean]
  'select-all': []
  'deselect-all': []
}>()

const internalSelected = ref(false)

const isSelected = computed(() =>
  props.selected !== undefined ? props.selected : internalSelected.value
)

function setSelected (value: boolean) {
  if (props.selected !== undefined) {
    emit('update:selected', value)
  } else {
    internalSelected.value = value
  }
}

const templateMenuItems = computed(() => {
  if (props.templateOptions.length === 0) return []
  return [
    { label: 'Auto', value: TEMPLATE_DROPDOWN_AUTO_VALUE },
    ...props.templateOptions.map((t) => ({ label: t }))
  ]
})
const isHover = ref(false)

const showCheckbox = computed(() => isHover.value || isSelected.value)
const showPromote = computed(() => isHover.value)

const stateClass = computed(() => {
  if (isSelected.value) return 'job-card--selected'
  if (isHover.value) return 'job-card--hover'
  return 'job-card--default'
})

const contextMenuOpen = ref(false)
const contextMenuRootRef = ref<HTMLElement | null>(null)
const contextMenuSubRef = ref<HTMLElement | null>(null)
const switchTemplateRowRef = ref<HTMLElement | null>(null)
const contextMenuStyle = ref<Record<string, string>>({})
const switchTemplateSubStyle = ref<Record<string, string>>({ display: 'none' })

const hoveredSwitchTemplateSub = ref(false)
let hideSwitchSubTimer: ReturnType<typeof setTimeout> | null = null

const scrollCloseOpts: AddEventListenerOptions = { capture: true, passive: true }

function clearHideSwitchSubTimer () {
  if (hideSwitchSubTimer != null) {
    clearTimeout(hideSwitchSubTimer)
    hideSwitchSubTimer = null
  }
}

function updateSwitchTemplateSubPosition () {
  const root = contextMenuRootRef.value
  const row = switchTemplateRowRef.value
  if (
    !root ||
    typeof window === 'undefined' ||
    !hoveredSwitchTemplateSub.value ||
    !row
  ) {
    switchTemplateSubStyle.value = { display: 'none' }
    return
  }
  const rr = root.getBoundingClientRect()
  const align = row.getBoundingClientRect()
  const edge = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--layout-edge-inset')
  ) || 8
  const maxW = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--dropdown-panel-width')
  ) || 250
  const subW = Math.min(
    maxW,
    Math.max(160, window.innerWidth - rr.right - edge)
  )
  const left = Math.min(rr.right - 4, window.innerWidth - subW - edge)
  switchTemplateSubStyle.value = {
    display: 'flex',
    position: 'fixed',
    top: `${align.top}px`,
    left: `${Math.max(edge, left)}px`,
    width: `${subW}px`,
    maxHeight: 'min(var(--dropdown-panel-max-height), 85vh)',
    zIndex: '10051'
  }
}

function onSwitchTemplateRowEnter () {
  clearHideSwitchSubTimer()
  hoveredSwitchTemplateSub.value = true
  nextTick(() => updateSwitchTemplateSubPosition())
}

function onSwitchTemplateRowLeave () {
  clearHideSwitchSubTimer()
  hideSwitchSubTimer = window.setTimeout(() => {
    hoveredSwitchTemplateSub.value = false
    hideSwitchSubTimer = null
  }, 220)
}

function onSwitchTemplateSubEnter () {
  clearHideSwitchSubTimer()
}

function onSwitchTemplateSubLeave () {
  hoveredSwitchTemplateSub.value = false
}

function onDocumentScrollCloseContextMenu (e: Event) {
  if (!contextMenuOpen.value) return
  const target = e.target
  if (target instanceof Node && contextMenuRootRef.value?.contains(target)) return
  if (target instanceof Node && contextMenuSubRef.value?.contains(target)) return
  contextMenuOpen.value = false
}

function onDocumentPointerDownContextMenu (e: MouseEvent) {
  if (!contextMenuOpen.value) return
  const t = e.target as Node
  if (contextMenuRootRef.value?.contains(t)) return
  if (contextMenuSubRef.value?.contains(t)) return
  contextMenuOpen.value = false
}

function onDocumentKeydownContextMenu (e: KeyboardEvent) {
  if (e.key === 'Escape' && contextMenuOpen.value) {
    contextMenuOpen.value = false
  }
}

watch(contextMenuOpen, (open) => {
  if (!open) {
    hoveredSwitchTemplateSub.value = false
    switchTemplateSubStyle.value = { display: 'none' }
    clearHideSwitchSubTimer()
    document.removeEventListener('scroll', onDocumentScrollCloseContextMenu, scrollCloseOpts)
    document.removeEventListener('pointerdown', onDocumentPointerDownContextMenu, true)
    document.removeEventListener('keydown', onDocumentKeydownContextMenu, true)
    return
  }
  document.addEventListener('scroll', onDocumentScrollCloseContextMenu, scrollCloseOpts)
  document.addEventListener('pointerdown', onDocumentPointerDownContextMenu, true)
  document.addEventListener('keydown', onDocumentKeydownContextMenu, true)
})

watch(hoveredSwitchTemplateSub, () => {
  nextTick(() => updateSwitchTemplateSubPosition())
})

onBeforeUnmount(() => {
  clearHideSwitchSubTimer()
  document.removeEventListener('scroll', onDocumentScrollCloseContextMenu, scrollCloseOpts)
  document.removeEventListener('pointerdown', onDocumentPointerDownContextMenu, true)
  document.removeEventListener('keydown', onDocumentKeydownContextMenu, true)
})

function onContextMenu (e: MouseEvent) {
  contextMenuOpen.value = true
  contextMenuStyle.value = {
    position: 'fixed',
    left: `${e.clientX}px`,
    top: `${e.clientY}px`,
    zIndex: '10050'
  }
}

function onContextSelectAll () {
  emit('select-all')
  contextMenuOpen.value = false
}

function onContextDeselectAll () {
  emit('deselect-all')
  contextMenuOpen.value = false
}

function onContextSwitchTemplate (title: string) {
  emit('switch-template', title)
  contextMenuOpen.value = false
  hoveredSwitchTemplateSub.value = false
}
</script>

<template>
  <article
    class="job-card"
    :class="stateClass"
    role="article"
    @mouseenter="isHover = true"
    @mouseleave="isHover = false"
    @contextmenu.prevent="onContextMenu"
  >
    <div class="job-card__inner">
      <div class="job-card__left">
        <div class="job-card__checkbox-wrap" :class="{ 'job-card__checkbox-wrap--visible': showCheckbox }">
          <Checkbox
            :model-value="isSelected"
            @update:model-value="setSelected"
          />
        </div>
        <Status :active="job.active" class="job-card__status" />
      </div>
      <div class="job-card__text">
        <h2 class="job-card__title">{{ job.jobTitle }}</h2>
        <div class="job-card__meta">
          <span class="job-card__meta-item">{{ job.location }}</span>
          <span class="job-card__meta-divider" aria-hidden="true" />
          <span class="job-card__meta-item">{{ job.industry }}</span>
          <span class="job-card__meta-divider" aria-hidden="true" />
          <span class="job-card__meta-item job-card__meta-item--company">{{ job.company }}</span>
        </div>
      </div>
      <div class="job-card__right">
        <DropdownSelector
          v-if="templateMenuItems.length > 0"
          :label="job.jobTemplate"
          :menu-items="templateMenuItems"
          :locked="assignmentLocked"
          @select="emit('select-template', $event)"
        />
        <DropdownSelector
          v-else
          :label="job.jobTemplate"
          readonly
        />
        <LastUpdated :date="job.lastUpdated" />
        <div class="job-card__actions">
          <div class="job-card__three-dot" @click.prevent @click.stop>
            <ThreeDotMenu />
          </div>
          <div class="job-card__promote-wrap" :class="{ 'job-card__promote-wrap--visible': showPromote }">
            <PromoteButton />
          </div>
        </div>
      </div>
    </div>
  </article>

  <Teleport to="body">
    <div
      v-show="contextMenuOpen"
      ref="contextMenuRootRef"
      class="job-card__context-menu context-menu"
      role="menu"
      aria-label="Job row actions"
      :style="contextMenuStyle"
    >
      <ContextMenuItem label="Select all" @click="onContextSelectAll" />
      <ContextMenuItem label="Deselect all" @click="onContextDeselectAll" />
      <button
        v-if="templateOptions.length > 0"
        ref="switchTemplateRowRef"
        type="button"
        class="job-card__context-switch-row"
        :class="{
          'job-card__context-switch-row--open': hoveredSwitchTemplateSub
        }"
        role="menuitem"
        @mouseenter="onSwitchTemplateRowEnter()"
        @mouseleave="onSwitchTemplateRowLeave"
      >
        <span class="job-card__context-switch-label">Switch template</span>
        <span class="job-card__context-switch-meta" aria-hidden="true">
          <img
            class="job-card__context-switch-arrow"
            :src="triangleArrowUrl"
            width="6"
            height="6"
            alt=""
          />
        </span>
      </button>
    </div>
    <div
      v-show="contextMenuOpen && hoveredSwitchTemplateSub && templateOptions.length > 0"
      ref="contextMenuSubRef"
      class="job-card__context-template-sub context-menu"
      role="menu"
      aria-label="Templates"
      :style="switchTemplateSubStyle"
      @mouseenter="onSwitchTemplateSubEnter"
      @mouseleave="onSwitchTemplateSubLeave"
      @click.stop
    >
      <div class="job-card__context-template-scroll">
        <button
          v-for="opt in templateOptions"
          :key="'ctx-tpl-' + opt"
          type="button"
          class="job-card__context-template-option"
          :class="{
            'job-card__context-template-option--current': job.jobTemplate === opt
          }"
          role="menuitem"
          @click="onContextSwitchTemplate(opt)"
        >
          <span class="job-card__context-template-option-label">{{ opt }}</span>
          <span class="job-card__context-template-check" aria-hidden="true">
            <svg
              v-show="job.jobTemplate === opt"
              width="12"
              height="10"
              viewBox="0 0 12 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 5L4.5 8.5L11 1.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.job-card {
  position: relative;
  width: 100%;
  border-bottom: none;
  background-color: var(--color-white);
}

.job-card::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.05) 50%,
    rgba(0, 0, 0, 0) 100%
  );
  pointer-events: none;
}

.job-card--hover {
  background-image: linear-gradient(
    to right,
    color-mix(in srgb, var(--color-background-secondary) 15%, transparent),
    var(--color-background-secondary) 25%,
    color-mix(in srgb, var(--color-background-secondary) 15%, transparent)
  );
}

.job-card--selected {
  background-image: linear-gradient(
    to right,
    color-mix(in srgb, var(--color-primary-muted) 15%, transparent),
    var(--color-primary-muted) 25%,
    color-mix(in srgb, var(--color-primary-muted) 15%, transparent)
  );
}

.job-card__inner {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
  max-width: 1366px;
  margin: 0 auto;
  height: 75px;
  padding: 5px 10px;
  box-sizing: border-box;
}

.job-card__left {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  width: fit-content;
  padding-left: 50px;
  align-self: center;
}

.job-card__checkbox-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  visibility: hidden;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.job-card__checkbox-wrap--visible {
  visibility: visible;
}

.job-card__status {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: center;
}

.job-card__text {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1 1 0;
  min-width: 0;
}

.job-card__title {
  margin: 0;
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

.job-card__meta {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.job-card__meta-item {
  font-family: var(--font-family-base);
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.job-card__meta-item--company {
  flex: 1 1 0;
  min-width: 0;
}

.job-card__meta-divider {
  width: 1px;
  height: 15px;
  background-color: var(--color-border-strong);
  flex-shrink: 0;
}

.job-card__right {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 50px;
  flex-shrink: 0;
  padding-right: 10px;
  margin-left: 50px;
}

.job-card__actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 25px;
}

.job-card__three-dot {
  display: inline-flex;
  cursor: default;
}

.job-card__promote-wrap {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  visibility: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.job-card__promote-wrap--visible {
  visibility: visible;
}

.job-card__context-menu {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 180px;
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

/* “Switch template” row — align with JobListFilterMenu root rows + triangle_arrow.svg */
.job-card__context-switch-row {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  width: 100%;
  min-height: var(--size-control-height-md);
  margin: 0;
  padding: 0 var(--space-md);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-secondary);
  text-align: left;
}

.job-card__context-switch-row:hover,
.job-card__context-switch-row--open {
  background-color: var(--color-background-tertiary);
}

.job-card__context-switch-row:focus {
  outline: none;
}

.job-card__context-switch-row:focus-visible {
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

.job-card__context-switch-label {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.job-card__context-switch-meta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 10px;
  height: 10px;
  flex-shrink: 0;
}

.job-card__context-switch-arrow {
  display: block;
  width: 6px;
  height: 6px;
}

.job-card__context-template-sub {
  box-sizing: border-box;
  flex-direction: column;
  overflow: hidden;
  border: none;
  border-radius: var(--radius-lg);
  background-color: var(--color-surface-frosted);
  -webkit-backdrop-filter: blur(var(--blur-backdrop-sm));
  backdrop-filter: blur(var(--blur-backdrop-sm));
  box-shadow: var(--shadow-elevation);
}

.job-card__context-template-scroll {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-3xs);
  overflow: auto;
  padding: var(--space-xs);
  max-height: inherit;
  width: 100%;
}

.job-card__context-template-option {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2xs);
  width: 100%;
  min-height: var(--size-control-height-md);
  margin: 0;
  padding: 0 var(--space-md);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-secondary);
  text-align: left;
}

.job-card__context-template-option:hover {
  background-color: var(--color-background-tertiary);
}

.job-card__context-template-option:focus {
  outline: none;
}

.job-card__context-template-option:focus-visible {
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

.job-card__context-template-option--current {
  background-color: var(--color-primary-muted);
  color: var(--color-primary);
}

.job-card__context-template-option--current:hover {
  background-color: var(--color-primary-muted);
}

.job-card__context-template-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: var(--size-icon-md);
  min-width: var(--size-icon-md);
  height: var(--size-icon-md);
  flex-shrink: 0;
  margin: 0;
  padding: 0;
  color: var(--color-primary);
}

.job-card__context-template-option-label {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
