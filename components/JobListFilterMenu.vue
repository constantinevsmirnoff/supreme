<script setup lang="ts">
/**
 * Job list filter — root menu + hover submenu (Figma UI Kit 146:2332).
 * Triangle arrow + count badge; submenu shows options with check + primary highlight when selected.
 */
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick
} from 'vue'
import { jobs, templates, jobListFacetFilters } from '@/src/state/jobsAndTemplatesStore.js'

type SubKey = 'location' | 'industry' | 'company' | 'template' | 'status'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const anchorRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const subPanelRef = ref<HTMLElement | null>(null)
const rootColumnRef = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({ display: 'none' })
const subPanelStyle = ref<Record<string, string>>({ display: 'none' })

const hoveredSub = ref<SubKey | null>(null)
/** Row that opened the submenu — used to align sub panel vertically */
const activeRowEl = ref<HTMLElement | null>(null)
let hideSubTimer: ReturnType<typeof setTimeout> | null = null

const scrollCloseOpts: AddEventListenerOptions = { capture: true, passive: true }

function uniqueSorted (field: 'location' | 'industry' | 'company'): string[] {
  const set = new Set<string>()
  for (const j of jobs.value as { location?: string; industry?: string; company?: string }[]) {
    const v = String(j[field] ?? '').trim()
    if (v) set.add(v)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

const locationOptions = computed(() => uniqueSorted('location'))
const industryOptions = computed(() => uniqueSorted('industry'))
const companyOptions = computed(() => uniqueSorted('company'))

const templateTitleOptions = computed(() => {
  const rows = templates.value as {
    title: string
    isDefault?: boolean
    templateActive?: boolean
  }[]
  const titles = rows
    .filter((t) => t.isDefault || t.templateActive !== false)
    .map((t) => String(t.title ?? '').trim())
    .filter(Boolean)
  return [...new Set(titles)].sort((a, b) => a.localeCompare(b))
})

const cbActive = computed({
  get () {
    const s = jobListFacetFilters.value.status
    if (s === 'active') return true
    if (s === 'inactive') return false
    return false
  },
  set (checked: boolean) {
    const s = jobListFacetFilters.value.status
    if (checked) {
      if (s === 'inactive') {
        jobListFacetFilters.value = {
          ...jobListFacetFilters.value,
          status: undefined
        }
      } else {
        jobListFacetFilters.value = {
          ...jobListFacetFilters.value,
          status: 'active'
        }
      }
    } else if (s === 'active') {
      jobListFacetFilters.value = {
        ...jobListFacetFilters.value,
        status: undefined
      }
    }
  }
})

const cbInactive = computed({
  get () {
    const s = jobListFacetFilters.value.status
    if (s === 'inactive') return true
    if (s === 'active') return false
    return false
  },
  set (checked: boolean) {
    const s = jobListFacetFilters.value.status
    if (checked) {
      if (s === 'active') {
        jobListFacetFilters.value = {
          ...jobListFacetFilters.value,
          status: undefined
        }
      } else {
        jobListFacetFilters.value = {
          ...jobListFacetFilters.value,
          status: 'inactive'
        }
      }
    } else if (s === 'inactive') {
      jobListFacetFilters.value = {
        ...jobListFacetFilters.value,
        status: undefined
      }
    }
  }
})

function countFor (key: SubKey): number {
  const f = jobListFacetFilters.value
  switch (key) {
    case 'location':
      return f.locations.length
    case 'industry':
      return f.industries.length
    case 'company':
      return f.companies.length
    case 'template':
      return f.templateTitles.length
    case 'status':
      return f.status != null ? 1 : 0
    default:
      return 0
  }
}

function toggleInList (
  key: 'locations' | 'industries' | 'companies' | 'templateTitles',
  value: string,
  checked: boolean
) {
  const cur = [...jobListFacetFilters.value[key]]
  const i = cur.indexOf(value)
  if (checked && i < 0) cur.push(value)
  if (!checked && i >= 0) cur.splice(i, 1)
  jobListFacetFilters.value = { ...jobListFacetFilters.value, [key]: cur }
}

function isSelected (
  key: 'locations' | 'industries' | 'companies' | 'templateTitles',
  value: string
): boolean {
  return jobListFacetFilters.value[key].includes(value)
}

function onOptionClick (
  key: 'locations' | 'industries' | 'companies' | 'templateTitles',
  value: string
) {
  const sel = isSelected(key, value)
  toggleInList(key, value, !sel)
}

function clearHideSubTimer () {
  if (hideSubTimer != null) {
    clearTimeout(hideSubTimer)
    hideSubTimer = null
  }
}

function onRootRowEnter (key: SubKey, e: MouseEvent) {
  clearHideSubTimer()
  hoveredSub.value = key
  activeRowEl.value = e.currentTarget as HTMLElement
  nextTick(() => updateSubPanelPosition())
}

function onRootRowLeave () {
  clearHideSubTimer()
  hideSubTimer = window.setTimeout(() => {
    hoveredSub.value = null
    activeRowEl.value = null
    hideSubTimer = null
  }, 220)
}

function onSubPanelEnter () {
  clearHideSubTimer()
}

function onSubPanelLeave () {
  hoveredSub.value = null
  activeRowEl.value = null
}

function updateSubPanelPosition () {
  const root = rootColumnRef.value
  const row = activeRowEl.value
  if (!root || typeof window === 'undefined' || !hoveredSub.value) {
    subPanelStyle.value = { display: 'none' }
    return
  }
  const rr = root.getBoundingClientRect()
  const align = row?.getBoundingClientRect() ?? rr
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
  /** Slight overlap so pointer can move from row to sub without closing */
  const left = Math.min(rr.right - 4, window.innerWidth - subW - edge)
  subPanelStyle.value = {
    display: 'flex',
    position: 'fixed',
    top: `${align.top}px`,
    left: `${Math.max(edge, left)}px`,
    width: `${subW}px`,
    maxHeight: 'min(var(--dropdown-panel-max-height), 85vh)',
    zIndex: '10051'
  }
}

function updatePanelPosition () {
  const el = anchorRef.value
  if (!el || typeof window === 'undefined') return
  const r = el.getBoundingClientRect()
  const root = document.documentElement
  const cs = getComputedStyle(root)
  const menuW = Number.parseFloat(cs.getPropertyValue('--dropdown-panel-width')) || 250
  const edge = Number.parseFloat(cs.getPropertyValue('--layout-edge-inset')) || 8
  /** Match Component Showcase context menu: 250px (Tag Input / Filter Options panel). */
  const panelWidth = menuW
  const left = Math.max(edge, Math.min(r.left, window.innerWidth - panelWidth - edge))
  panelStyle.value = {
    display: 'flex',
    position: 'fixed',
    top: `${r.bottom + 4}px`,
    left: `${left}px`,
    width: `${panelWidth}px`,
    maxHeight: 'min(var(--dropdown-panel-max-height), 85vh)',
    zIndex: '10050'
  }
  nextTick(() => updateSubPanelPosition())
}

function close () {
  hoveredSub.value = null
  activeRowEl.value = null
  emit('update:open', false)
}

function onDocumentScrollClose (e: Event) {
  if (!props.open) return
  const target = e.target
  if (target instanceof Node && panelRef.value?.contains(target)) return
  if (target instanceof Node && subPanelRef.value?.contains(target)) return
  if (target instanceof Node && anchorRef.value?.contains(target)) return
  close()
}

function onDocumentPointerDown (e: MouseEvent) {
  if (!props.open) return
  const t = e.target as Node
  if (panelRef.value?.contains(t)) return
  if (subPanelRef.value?.contains(t)) return
  if (anchorRef.value?.contains(t)) return
  close()
}

function onDocumentKeydown (e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) close()
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      hoveredSub.value = null
      activeRowEl.value = null
      panelStyle.value = { display: 'none' }
      subPanelStyle.value = { display: 'none' }
      return
    }
    nextTick(() => {
      updatePanelPosition()
    })
  }
)

watch(
  () => hoveredSub.value,
  () => nextTick(() => updateSubPanelPosition())
)

watch(jobListFacetFilters, () => nextTick(() => updateSubPanelPosition()), { deep: true })

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
  document.addEventListener('keydown', onDocumentKeydown, true)
  document.addEventListener('scroll', onDocumentScrollClose, scrollCloseOpts)
})

onBeforeUnmount(() => {
  clearHideSubTimer()
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  document.removeEventListener('keydown', onDocumentKeydown, true)
  document.removeEventListener('scroll', onDocumentScrollClose, scrollCloseOpts)
})

const rootItems: { key: SubKey; label: string }[] = [
  { key: 'location', label: 'Location' },
  { key: 'industry', label: 'Industry' },
  { key: 'company', label: 'Company' },
  { key: 'template', label: 'Template' },
  { key: 'status', label: 'Status' }
]

function toggleStatusActive () {
  cbActive.value = !cbActive.value
}

function toggleStatusInactive () {
  cbInactive.value = !cbInactive.value
}
</script>

<template>
  <div ref="anchorRef" class="job-list-filter-menu__anchor">
    <slot />
  </div>
  <Teleport to="body">
    <div
      v-show="open"
      ref="panelRef"
      class="job-list-filter-menu job-list-filter-menu--root context-menu"
      role="presentation"
      :style="panelStyle"
      @click.stop
    >
      <div
        ref="rootColumnRef"
        class="job-list-filter-menu__scroll"
      >
        <div
          v-for="item in rootItems"
          :key="item.key"
          class="job-list-filter-menu__root-row"
          :class="{ 'job-list-filter-menu__root-row--open': hoveredSub === item.key }"
          role="menuitem"
          @mouseenter="onRootRowEnter(item.key, $event)"
          @mouseleave="onRootRowLeave"
        >
          <span class="job-list-filter-menu__root-label">{{ item.label }}</span>
          <span class="job-list-filter-menu__root-meta">
            <span
              v-if="countFor(item.key) > 0"
              class="job-list-filter-menu__count"
              aria-hidden="true"
            >{{ countFor(item.key) > 99 ? '99+' : countFor(item.key) }}</span>
            <span class="job-list-filter-menu__arrow" aria-hidden="true">
              <svg
                class="job-list-filter-menu__arrow-svg"
                width="6"
                height="6"
                viewBox="0 0 6 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0.000230379 0.806055C0.000230379 0.641438 0.0361812 0.498581 0.108083 0.377483C0.179984 0.256386 0.276484 0.162724 0.397581 0.0964993C0.518679 0.0321663 0.653021 -2.09542e-07 0.800609 -2.0309e-07C0.944412 -1.96805e-07 1.08159 0.0378428 1.21215 0.113529L5.04091 2.31031C5.17525 2.38411 5.27648 2.48344 5.3446 2.60833C5.41272 2.73321 5.44678 2.86377 5.44678 3C5.44678 3.13623 5.41272 3.26585 5.3446 3.38884C5.27838 3.51183 5.17715 3.61211 5.04091 3.68969L1.21215 5.88647C1.14782 5.92431 1.08065 5.9527 1.01064 5.97162C0.940628 5.99054 0.870618 6 0.800609 6C0.653021 6 0.518679 5.96689 0.397581 5.90066C0.276484 5.83444 0.179984 5.74078 0.108083 5.61968C0.0361812 5.50047 0.000230379 5.35856 0.000230379 5.19395V0.806055Z"
                  fill="currentColor"
                />
              </svg>
            </span>
          </span>
        </div>
      </div>
    </div>

    <!-- Secondary panel: options for hovered category -->
    <div
      v-show="open && hoveredSub != null"
      ref="subPanelRef"
      class="job-list-filter-menu job-list-filter-menu--sub context-menu"
      role="menu"
      :aria-label="hoveredSub ? `${hoveredSub} filters` : undefined"
      :style="subPanelStyle"
      @mouseenter="onSubPanelEnter"
      @mouseleave="onSubPanelLeave"
      @click.stop
    >
      <div class="job-list-filter-menu__sub-scroll">
        <!-- Location -->
        <template v-if="hoveredSub === 'location'">
          <button
            v-for="opt in locationOptions"
            :key="'loc-' + opt"
            type="button"
            class="job-list-filter-menu__option"
            :class="{ 'job-list-filter-menu__option--selected': isSelected('locations', opt) }"
            role="menuitemcheckbox"
            :aria-checked="isSelected('locations', opt)"
            @click="onOptionClick('locations', opt)"
          >
            <span class="job-list-filter-menu__option-label">{{ opt }}</span>
            <span
              class="job-list-filter-menu__check"
              aria-hidden="true"
            >
              <svg
                v-show="isSelected('locations', opt)"
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
          <p
            v-if="locationOptions.length === 0"
            class="job-list-filter-menu__empty"
          >
            No locations
          </p>
        </template>

        <!-- Industry -->
        <template v-if="hoveredSub === 'industry'">
          <button
            v-for="opt in industryOptions"
            :key="'ind-' + opt"
            type="button"
            class="job-list-filter-menu__option"
            :class="{ 'job-list-filter-menu__option--selected': isSelected('industries', opt) }"
            role="menuitemcheckbox"
            :aria-checked="isSelected('industries', opt)"
            @click="onOptionClick('industries', opt)"
          >
            <span class="job-list-filter-menu__option-label">{{ opt }}</span>
            <span class="job-list-filter-menu__check" aria-hidden="true">
              <svg
                v-show="isSelected('industries', opt)"
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
          <p
            v-if="industryOptions.length === 0"
            class="job-list-filter-menu__empty"
          >
            No industries
          </p>
        </template>

        <!-- Company -->
        <template v-if="hoveredSub === 'company'">
          <button
            v-for="opt in companyOptions"
            :key="'co-' + opt"
            type="button"
            class="job-list-filter-menu__option"
            :class="{ 'job-list-filter-menu__option--selected': isSelected('companies', opt) }"
            role="menuitemcheckbox"
            :aria-checked="isSelected('companies', opt)"
            @click="onOptionClick('companies', opt)"
          >
            <span class="job-list-filter-menu__option-label">{{ opt }}</span>
            <span class="job-list-filter-menu__check" aria-hidden="true">
              <svg
                v-show="isSelected('companies', opt)"
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
          <p
            v-if="companyOptions.length === 0"
            class="job-list-filter-menu__empty"
          >
            No companies
          </p>
        </template>

        <!-- Template -->
        <template v-if="hoveredSub === 'template'">
          <button
            v-for="opt in templateTitleOptions"
            :key="'tpl-' + opt"
            type="button"
            class="job-list-filter-menu__option"
            :class="{ 'job-list-filter-menu__option--selected': isSelected('templateTitles', opt) }"
            role="menuitemcheckbox"
            :aria-checked="isSelected('templateTitles', opt)"
            @click="onOptionClick('templateTitles', opt)"
          >
            <span class="job-list-filter-menu__option-label">{{ opt }}</span>
            <span class="job-list-filter-menu__check" aria-hidden="true">
              <svg
                v-show="isSelected('templateTitles', opt)"
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
          <p
            v-if="templateTitleOptions.length === 0"
            class="job-list-filter-menu__empty"
          >
            No templates
          </p>
        </template>

        <!-- Status -->
        <template v-if="hoveredSub === 'status'">
          <button
            type="button"
            class="job-list-filter-menu__option"
            :class="{ 'job-list-filter-menu__option--selected': cbActive }"
            role="menuitemcheckbox"
            :aria-checked="cbActive"
            @click="toggleStatusActive"
          >
            <span class="job-list-filter-menu__option-label">Active</span>
            <span class="job-list-filter-menu__check" aria-hidden="true">
              <svg
                v-show="cbActive"
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
          <button
            type="button"
            class="job-list-filter-menu__option"
            :class="{ 'job-list-filter-menu__option--selected': cbInactive }"
            role="menuitemcheckbox"
            :aria-checked="cbInactive"
            @click="toggleStatusInactive"
          >
            <span class="job-list-filter-menu__option-label">Inactive</span>
            <span class="job-list-filter-menu__check" aria-hidden="true">
              <svg
                v-show="cbInactive"
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
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.job-list-filter-menu__anchor {
  display: inline-flex;
  flex-shrink: 0;
}

/* Shell: same as Showcase `context-menu-demo` — Figma Tag Input / Filter Options (86:6626) */
.job-list-filter-menu {
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

.job-list-filter-menu--sub {
  flex-direction: column;
}

.job-list-filter-menu__scroll {
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

.job-list-filter-menu__sub-scroll {
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

/* Rows align with `ContextMenuItem` — Figma ContextMenuItem (86:6592) */
.job-list-filter-menu__root-row {
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

.job-list-filter-menu__root-row:hover,
.job-list-filter-menu__root-row--open {
  background-color: var(--color-background-tertiary);
}

.job-list-filter-menu__root-row:focus {
  outline: none;
}

.job-list-filter-menu__root-row:focus-visible {
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

.job-list-filter-menu__root-label {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.job-list-filter-menu__root-meta {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.job-list-filter-menu__count {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 var(--space-2xs);
  border-radius: var(--space-5xl);
  background-color: var(--color-primary);
  font-family: var(--font-family-base);
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-strong);
  line-height: 1;
  letter-spacing: var(--typography-body-letter-spacing);
  color: var(--color-white);
}

.job-list-filter-menu__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 10px;
  height: 10px;
  color: var(--color-text-secondary);
}

.job-list-filter-menu__arrow-svg {
  display: block;
}

.job-list-filter-menu__option {
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

.job-list-filter-menu__option:hover {
  background-color: var(--color-background-tertiary);
}

.job-list-filter-menu__option:focus {
  outline: none;
}

.job-list-filter-menu__option:focus-visible {
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

.job-list-filter-menu__option--selected {
  background-color: var(--color-primary-muted);
  color: var(--color-primary);
}

.job-list-filter-menu__option--selected:hover {
  background-color: var(--color-primary-muted);
}

/* Trailing check slot — fixed width so toggling selection does not shift label text */
.job-list-filter-menu__check {
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

.job-list-filter-menu__option-label {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.job-list-filter-menu__empty {
  margin: var(--space-2xs) var(--space-md);
  font-family: var(--font-family-base);
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-light);
  line-height: var(--typography-body-line-height);
  letter-spacing: var(--typography-body-letter-spacing);
  color: var(--color-text-tertiary);
}
</style>
