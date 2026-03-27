<script setup lang="ts">
/**
 * Dropdown Selector — Figma: Dropdown Selector (node 6:1660)
 * States: Default, Hover, Focus, Disabled, Locked (auto-assigned job: press-hold 700ms to unlock).
 * Lead icons: locked.svg / unlocked.svg. Optional menu: ContextMenuItem rows.
 */
import {
  computed,
  ref,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount
} from 'vue'
import ContextMenuItem from '@/components/ui/ContextMenuItem.vue'
import Annotation from '@/components/ui/Annotation.vue'
import lockedIconUrl from '@/icons/locked.svg?url'
import unlockedIconUrl from '@/icons/unlocked.svg?url'

const HOLD_MS = 700
const ICON_OPEN_DELAY_MS = 280

/** Keep in sync with `.dropdown` / `--dropdown-border-radius` */
const DROPDOWN_BORDER_RADIUS_PX = 5
/**
 * Glow `<rect>` vs button border box: parallel offset for corner radius (SVG padding vs rect x/y).
 * Stroke corner radius = border-radius + this outset so arcs stay parallel to the control.
 */
const GLOW_PATH_OUTSIDE_BUTTON_PX = 1
const GLOW_CORNER_RX_PX = DROPDOWN_BORDER_RADIUS_PX + GLOW_PATH_OUTSIDE_BUTTON_PX

const props = withDefaults(
  defineProps<{
    label?: string
    disabled?: boolean
    readonly?: boolean
    menuItems?: { label: string; value?: string }[]
    /** Auto-assigned template: press-hold to unlock and pick manually */
    locked?: boolean
  }>(),
  {
    label: 'Default',
    disabled: false,
    readonly: false,
    menuItems: () => [],
    locked: false
  }
)

const emit = defineEmits<{
  select: [value: string]
}>()

const isHover = ref(false)
const isFocus = ref(false)
const menuOpen = ref(false)
const anchorWrapRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLElement | null>(null)
const menuPanelRef = ref<HTMLElement | null>(null)
const menuStyle = ref<Record<string, string>>({ display: 'none' })

const sessionUnlocked = ref(false)
const pendingUnlockSession = ref(false)
const selectedDuringUnlockSession = ref(false)
/** Swallow the trigger click from the release after hold-unlock so the menu stays open */
const ignoreNextTriggerClick = ref(false)

const isHolding = ref(false)
const holdProgress = ref(0)
let holdStart = 0
let holdRaf = 0

const glowW = ref(80)
const glowH = ref(32)

const glowGradientId = `dropdown-glow-${Math.random().toString(36).slice(2, 9)}`
const annotationHintId = `dropdown-hint-${Math.random().toString(36).slice(2, 9)}`

const hasMenu = computed(
  () => !props.readonly && (props.menuItems?.length ?? 0) > 0
)

/** Locked presentation (icon strip / annotation hint): parent says locked and session not cleared */
const assignmentLockedUi = computed(
  () => props.locked && !sessionUnlocked.value
)

/** Press-hold and click block only when there is a menu to open */
const interactionLocked = computed(
  () => assignmentLockedUi.value && hasMenu.value
)

const showGlow = computed(
  () =>
    interactionLocked.value &&
    isHolding.value &&
    holdProgress.value > 0
)

const showAnnotationLayer = computed(
  () => assignmentLockedUi.value && isHover.value && !props.disabled
)

const stateClass = computed(() => {
  if (props.disabled) return 'dropdown--disabled'
  if (isFocus.value) return 'dropdown--focus'
  if (isHover.value) return 'dropdown--hover'
  return 'dropdown--default'
})

function measureGlowBox () {
  const btn = buttonRef.value
  if (!btn) return
  const r = btn.getBoundingClientRect()
  glowW.value = Math.max(48, Math.ceil(r.width) + 8)
  glowH.value = Math.max(28, Math.ceil(r.height) + 8)
}

function cancelHold () {
  if (holdRaf) {
    cancelAnimationFrame(holdRaf)
    holdRaf = 0
  }
  isHolding.value = false
  holdProgress.value = 0
  holdStart = 0
}

function completeHold () {
  cancelHold()
  sessionUnlocked.value = true
  pendingUnlockSession.value = true
  selectedDuringUnlockSession.value = false
  nextTick(() => {
    measureGlowBox()
    setTimeout(() => {
      if (!hasMenu.value) return
      menuOpen.value = true
      ignoreNextTriggerClick.value = true
    }, ICON_OPEN_DELAY_MS)
  })
}

function tickHold () {
  const elapsed = performance.now() - holdStart
  const p = Math.min(1, elapsed / HOLD_MS)
  holdProgress.value = p
  if (p >= 1) {
    completeHold()
    return
  }
  holdRaf = requestAnimationFrame(tickHold)
}

function onButtonPointerDown (e: PointerEvent) {
  if (props.disabled || !interactionLocked.value) return
  if (e.button !== 0) return
  measureGlowBox()
  isHolding.value = true
  holdStart = performance.now()
  holdProgress.value = 0
  holdRaf = requestAnimationFrame(tickHold)
}

function onButtonPointerUp () {
  if (!interactionLocked.value) return
  if (holdProgress.value < 1) {
    cancelHold()
  }
}


function onButtonPointerCancel () {
  cancelHold()
}

watch(
  () => props.locked,
  (v) => {
    if (!v) {
      sessionUnlocked.value = false
      pendingUnlockSession.value = false
      selectedDuringUnlockSession.value = false
      cancelHold()
    }
  }
)

function updateMenuPosition () {
  const el = anchorWrapRef.value
  if (!el || typeof window === 'undefined') return
  const r = el.getBoundingClientRect()
  menuStyle.value = {
    display: 'flex',
    position: 'fixed',
    top: `${r.bottom + 4}px`,
    left: `${Math.max(8, Math.min(r.left, window.innerWidth - 258))}px`,
    minWidth: `${Math.max(r.width, 160)}px`,
    maxHeight: 'min(320px, 40vh)',
    zIndex: '10050'
  }
}

function onDocumentScrollCloseMenu (e: Event) {
  if (!menuOpen.value) return
  const target = e.target
  if (target instanceof Node && menuPanelRef.value?.contains(target)) return
  if (target instanceof Node && anchorWrapRef.value?.contains(target)) return
  menuOpen.value = false
}

const scrollCloseOpts: AddEventListenerOptions = { capture: true, passive: true }

watch(menuOpen, (open, prevOpen) => {
  if (!open) {
    menuStyle.value = { display: 'none' }
    ignoreNextTriggerClick.value = false
    if (prevOpen === true) {
      if (pendingUnlockSession.value && !selectedDuringUnlockSession.value) {
        sessionUnlocked.value = false
      }
      pendingUnlockSession.value = false
      selectedDuringUnlockSession.value = false
    }
    return
  }
  nextTick(() => {
    updateMenuPosition()
    menuPanelRef.value?.querySelector('button')?.focus()
  })
})

function onTriggerClick () {
  if (props.disabled) return
  if (!hasMenu.value) return
  if (interactionLocked.value) return
  if (menuOpen.value && ignoreNextTriggerClick.value) {
    ignoreNextTriggerClick.value = false
    return
  }
  menuOpen.value = !menuOpen.value
}

function onSelectItem (item: { label: string; value?: string }) {
  if (pendingUnlockSession.value) {
    selectedDuringUnlockSession.value = true
  }
  emit('select', item.value ?? item.label)
  menuOpen.value = false
}

function onDocPointerDown (e: MouseEvent) {
  if (!menuOpen.value) return
  const t = e.target as Node
  if (menuPanelRef.value?.contains(t)) return
  if (anchorWrapRef.value?.contains(t)) return
  menuOpen.value = false
}

function onDocKeydown (e: KeyboardEvent) {
  if (e.key === 'Escape' && menuOpen.value) {
    menuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown, true)
  document.addEventListener('keydown', onDocKeydown, true)
  document.addEventListener('scroll', onDocumentScrollCloseMenu, scrollCloseOpts)
})

onBeforeUnmount(() => {
  cancelHold()
  document.removeEventListener('scroll', onDocumentScrollCloseMenu, scrollCloseOpts)
  document.removeEventListener('pointerdown', onDocPointerDown, true)
  document.removeEventListener('keydown', onDocKeydown, true)
})

const glowRectRx = computed(() => {
  const w = Math.max(glowW.value - 6, 8)
  const h = Math.max(glowH.value - 6, 8)
  return Math.min(GLOW_CORNER_RX_PX, w / 2, h / 2)
})

const glowPerimeter = computed(() => {
  const w = Math.max(glowW.value - 6, 8)
  const h = Math.max(glowH.value - 6, 8)
  const rx = glowRectRx.value
  const straight = 2 * (w - 2 * rx) + 2 * (h - 2 * rx)
  const arc = 2 * Math.PI * rx
  return straight + arc
})

/** Visible segment length; gap fills the rest of the perimeter so one “snake” runs around the rect */
const glowSnakeLength = computed(() => {
  const p = glowPerimeter.value
  const target = Math.max(22, p * 0.32)
  return Math.min(target, p - 4)
})

const glowSnakeDashArray = computed(() => {
  const p = glowPerimeter.value
  const len = glowSnakeLength.value
  return `${len} ${p - len}`
})

/** Shift pattern by full perimeter over hold so the segment makes one lap */
const glowSnakeDashOffset = computed(
  () => -glowPerimeter.value * holdProgress.value
)
</script>

<template>
  <div v-if="readonly" class="dropdown dropdown--default dropdown--readonly" aria-hidden="true">
    <span class="dropdown__icon" aria-hidden="true">
      <img class="dropdown__icon-img" :src="lockedIconUrl" alt="">
    </span>
    <span class="dropdown__label">{{ label }}</span>
    <span class="dropdown__chevron" aria-hidden="true">
      <svg width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
  </div>
  <div
    v-else
    ref="anchorWrapRef"
    class="dropdown-anchor"
    @mouseenter="isHover = true"
    @mouseleave="isHover = false"
  >
    <span :id="annotationHintId" class="dropdown__sr-only">
      Press and hold to unlock template selection.
    </span>
    <div class="dropdown__shell">
      <svg
        v-show="showGlow"
        class="dropdown__glow-svg"
        aria-hidden="true"
        :width="glowW"
        :height="glowH"
        :viewBox="`0 0 ${glowW} ${glowH}`"
      >
        <defs>
          <linearGradient :id="glowGradientId" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color: var(--color-primary)" />
            <stop offset="100%" style="stop-color: var(--color-primary-dark)" />
          </linearGradient>
        </defs>
        <rect
          x="3"
          y="3"
          :width="glowW - 6"
          :height="glowH - 6"
          :rx="glowRectRx"
          :ry="glowRectRx"
          fill="none"
          :stroke="`url(#${glowGradientId})`"
          stroke-width="1"
          stroke-opacity="0.5"
          stroke-linecap="round"
          :stroke-dasharray="glowSnakeDashArray"
          :stroke-dashoffset="glowSnakeDashOffset"
        />
      </svg>
      <button
        ref="buttonRef"
        type="button"
        class="dropdown"
        :class="stateClass"
        :disabled="disabled"
        :aria-expanded="hasMenu && !interactionLocked ? menuOpen : undefined"
        :aria-haspopup="hasMenu ? 'menu' : undefined"
        :aria-disabled="interactionLocked ? true : undefined"
        :aria-describedby="assignmentLockedUi ? annotationHintId : undefined"
        @focus="isFocus = true"
        @blur="isFocus = false"
        @click="onTriggerClick"
        @pointerdown="onButtonPointerDown"
        @pointerup="onButtonPointerUp"
        @pointercancel="onButtonPointerCancel"
      >
        <span class="dropdown__icon" aria-hidden="true">
          <span
            class="dropdown__icon-window"
            :class="{ 'dropdown__icon-window--unlocked': !assignmentLockedUi }"
          >
            <span class="dropdown__icon-track">
              <img class="dropdown__icon-img" :src="lockedIconUrl" alt="">
              <img class="dropdown__icon-img" :src="unlockedIconUrl" alt="">
            </span>
          </span>
        </span>
        <span class="dropdown__label">{{ label }}</span>
        <span class="dropdown__chevron" aria-hidden="true">
          <svg width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </button>
    </div>
    <div v-show="showAnnotationLayer" class="dropdown__annotation">
      <Annotation text="Press and hold to unlock" />
    </div>
  </div>
  <Teleport to="body">
    <div
      v-show="hasMenu && menuOpen"
      ref="menuPanelRef"
      class="dropdown__menu context-menu"
      role="menu"
      :aria-label="`Options for ${label}`"
      :style="menuStyle"
    >
      <ContextMenuItem
        v-for="(item, idx) in menuItems"
        :key="item.value ?? item.label ?? idx"
        :label="item.label"
        @click="onSelectItem(item)"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.dropdown-anchor {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
}

.dropdown__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.dropdown__shell {
  --dropdown-border-radius: 5px;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.dropdown__glow-svg {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 0;
  overflow: visible;
}

.dropdown {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0px 6px;
  border: 1px solid;
  border-radius: var(--dropdown-border-radius, 5px);
  background: transparent;
  cursor: pointer;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-secondary);
  min-height: 24px;
}

.dropdown:focus {
  outline: none;
}

.dropdown--default {
  border-color: var(--color-border-strong);
  background: transparent;
}

.dropdown--hover {
  border-color: var(--color-border-strong);
  background-color: var(--color-background-tertiary);
}

.dropdown--focus {
  border-color: var(--color-focus-ring);
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

.dropdown--disabled {
  border-color: var(--color-border-strong);
  background-color: var(--color-background-tertiary);
  color: var(--color-text-tertiary);
  opacity: 0.7;
  cursor: not-allowed;
}

.dropdown__icon,
.dropdown__chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  flex-shrink: 0;
}

.dropdown__icon {
  width: 10px;
  height: 10px;
}

.dropdown__icon-window {
  display: block;
  width: 10px;
  height: 10px;
  overflow: hidden;
}

.dropdown__icon-track {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  width: 20px;
  height: 10px;
  transform: translateX(0);
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown__icon-window--unlocked .dropdown__icon-track {
  transform: translateX(-10px);
}

.dropdown__icon-img {
  display: block;
  width: 10px;
  height: 10px;
  max-width: 10px;
  max-height: 10px;
  object-fit: contain;
  flex-shrink: 0;
}

.dropdown__chevron {
  width: 8px;
  height: 5px;
}

.dropdown__label {
  white-space: nowrap;
}

.dropdown--readonly {
  cursor: default;
  pointer-events: none;
}

.dropdown__annotation {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 6px;
  z-index: 20;
  pointer-events: none;
}

.dropdown__menu {
  pointer-events: auto;
  flex-direction: column;
  gap: 3px;
  padding: 5px;
  box-sizing: border-box;
  border-radius: 6px;
  border: none;
  background-color: rgba(255, 255, 255, 0.8);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  box-shadow: 0 7px 22px 0 rgba(0, 0, 0, 0.25);
  overflow-y: auto;
}
</style>
