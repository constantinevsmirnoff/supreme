<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import CloseButton from '@/components/ui/CloseButton.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import assignmentIconUrl from '@/icons/assignment.svg?url'

type AssignmentAttribute = 'location' | 'industry' | 'company' | 'title'

const props = defineProps<{
  activeAttributes: AssignmentAttribute[]
}>()

const emit = defineEmits<{
  close: []
  save: [attributes: AssignmentAttribute[]]
}>()

const shellVisible = ref(false)
const draftActive = ref<AssignmentAttribute[]>([])
const draggedActiveAttr = ref<AssignmentAttribute | null>(null)
const dropIndicator = ref<{
  attr: AssignmentAttribute
  position: 'before' | 'after'
} | null>(null)
const dropListEdge = ref<'start' | 'end' | null>(null)
const dropInsertIndex = ref<number | null>(null)
let dragGhostEl: HTMLElement | null = null
const pendingToggleState = ref<Record<AssignmentAttribute, boolean>>({})
const moveTimers = new Map<AssignmentAttribute, ReturnType<typeof setTimeout>>()
const STATE_TRANSFER_DELAY_MS = 60

const ALL_ATTRIBUTES: AssignmentAttribute[] = [
  'location',
  'industry',
  'company',
  'title'
]

const LABELS: Record<AssignmentAttribute, string> = {
  location: 'Location',
  industry: 'Industry',
  company: 'Company',
  title: 'Title'
}

function normalizeAttributes (raw: AssignmentAttribute[]): AssignmentAttribute[] {
  const seen = new Set<AssignmentAttribute>()
  const out: AssignmentAttribute[] = []
  for (const attr of raw) {
    if (!ALL_ATTRIBUTES.includes(attr)) continue
    if (seen.has(attr)) continue
    seen.add(attr)
    out.push(attr)
  }
  return out
}

function persistDraft () {
  emit('save', normalizeAttributes(draftActive.value))
}

watch(
  () => props.activeAttributes,
  () => {
    draftActive.value = normalizeAttributes(props.activeAttributes ?? [])
  },
  { immediate: true, deep: true }
)

const orderedAttributes = computed(() => {
  const inactive = ALL_ATTRIBUTES.filter((attr) => !draftActive.value.includes(attr))
  return [...draftActive.value, ...inactive]
})

function isActiveAttribute (attr: AssignmentAttribute): boolean {
  return draftActive.value.includes(attr)
}

function moveToActive (attr: AssignmentAttribute) {
  if (draftActive.value.includes(attr)) return
  draftActive.value = [...draftActive.value, attr]
  persistDraft()
}

function moveToInactive (attr: AssignmentAttribute) {
  if (!draftActive.value.includes(attr)) return
  draftActive.value = draftActive.value.filter((x) => x !== attr)
  persistDraft()
}

function clearMoveTimer (attr: AssignmentAttribute) {
  const timer = moveTimers.get(attr)
  if (timer != null) {
    clearTimeout(timer)
    moveTimers.delete(attr)
  }
}

function beginMoveToActive (attr: AssignmentAttribute) {
  if (pendingToggleState.value[attr] === true) return
  clearMoveTimer(attr)
  pendingToggleState.value = { ...pendingToggleState.value, [attr]: true }
  const timer = setTimeout(() => {
    moveToActive(attr)
    const next = { ...pendingToggleState.value }
    delete next[attr]
    pendingToggleState.value = next
    moveTimers.delete(attr)
  }, STATE_TRANSFER_DELAY_MS)
  moveTimers.set(attr, timer)
}

function beginMoveToInactive (attr: AssignmentAttribute) {
  if (pendingToggleState.value[attr] === false) return
  clearMoveTimer(attr)
  pendingToggleState.value = { ...pendingToggleState.value, [attr]: false }
  const timer = setTimeout(() => {
    moveToInactive(attr)
    const next = { ...pendingToggleState.value }
    delete next[attr]
    pendingToggleState.value = next
    moveTimers.delete(attr)
  }, STATE_TRANSFER_DELAY_MS)
  moveTimers.set(attr, timer)
}

function rowToggleValue (attr: AssignmentAttribute, fallback: boolean): boolean {
  const staged = pendingToggleState.value[attr]
  if (staged === true) return true
  if (staged === false) return false
  return fallback
}

function removeDragGhost () {
  if (dragGhostEl != null) {
    dragGhostEl.remove()
    dragGhostEl = null
  }
}

function createDragGhost (label: string): HTMLElement {
  const el = document.createElement('div')
  el.textContent = label
  el.style.position = 'fixed'
  el.style.top = '-9999px'
  el.style.left = '-9999px'
  el.style.pointerEvents = 'none'
  el.style.boxSizing = 'border-box'
  el.style.maxWidth = '260px'
  el.style.padding = '3px 6px'
  el.style.margin = '0 6px'
  el.style.borderRadius = '8px'
  el.style.backgroundColor = '#fefefe'
  el.style.color = '#474747'
  el.style.fontFamily = 'var(--font-family-base)'
  el.style.fontSize = '12px'
  el.style.fontWeight = '500'
  el.style.lineHeight = '16px'
  el.style.letterSpacing = '0.06px'
  el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.12)'
  el.style.border = '1px solid var(--color-border-light)'
  el.style.overflow = 'hidden'
  el.style.textOverflow = 'ellipsis'
  el.style.whiteSpace = 'nowrap'
  document.body.appendChild(el)
  return el
}

function onActiveDragStart (e: DragEvent, attr: AssignmentAttribute) {
  draggedActiveAttr.value = attr
  dropIndicator.value = null
  dropListEdge.value = null
  dropInsertIndex.value = null
  removeDragGhost()
  if (e.dataTransfer) {
    dragGhostEl = createDragGhost(LABELS[attr])
    e.dataTransfer.effectAllowed = 'move'
    // Keep ghost mostly below cursor so insertion line remains visible.
    e.dataTransfer.setDragImage(dragGhostEl, 6, 0)
  }
}

function onActiveDragEnd (e: DragEvent) {
  draggedActiveAttr.value = null
  dropIndicator.value = null
  dropListEdge.value = null
  dropInsertIndex.value = null
  removeDragGhost()
}

function applyIndicatorFromInsertIndex (insertIdx: number) {
  const dragged = draggedActiveAttr.value
  if (dragged != null && !wouldInsertIndexReorder(dragged, insertIdx)) {
    dropListEdge.value = null
    dropIndicator.value = null
    return
  }
  const n = draftActive.value.length
  if (insertIdx <= 0) {
    dropListEdge.value = 'start'
    dropIndicator.value = null
    return
  }
  if (insertIdx >= n) {
    dropListEdge.value = null
    dropIndicator.value = n > 0
      ? { attr: draftActive.value[n - 1], position: 'after' }
      : null
    return
  }
  dropListEdge.value = null
  dropIndicator.value = {
    attr: draftActive.value[insertIdx],
    position: 'before'
  }
}

function wouldInsertIndexReorder (from: AssignmentAttribute, insertFromIndicator: number): boolean {
  const fromIdx = draftActive.value.indexOf(from)
  if (fromIdx < 0) return false
  let insertIdx = insertFromIndicator
  if (fromIdx < insertIdx) insertIdx -= 1
  return insertIdx !== fromIdx
}

function computeInsertIndexFromCursor (
  container: HTMLElement,
  clientY: number
): { insertIdx: number; mids: number[] } {
  const rows = Array.from(
    container.querySelectorAll<HTMLElement>(':scope > .assignment-settings-overlay__row--active')
  )
  const mids = rows.map((row) => {
    const rect = row.getBoundingClientRect()
    return rect.top + rect.height / 2
  })
  let idx = 0
  while (idx < mids.length && clientY > mids[idx]) idx += 1
  return { insertIdx: idx, mids }
}

function onActiveListDragOver (e: DragEvent) {
  if (draggedActiveAttr.value == null) return
  const container = e.currentTarget
  if (!(container instanceof HTMLElement)) return
  const { insertIdx: rawInsertIdx, mids } = computeInsertIndexFromCursor(
    container,
    e.clientY
  )
  let stabilizedInsertIdx = rawInsertIdx
  const prev = dropInsertIndex.value
  if (
    prev != null &&
    prev !== rawInsertIdx &&
    mids.length > 0 &&
    prev >= 0 &&
    prev <= mids.length
  ) {
    // Keep hysteresis only for interior boundaries; never clamp end-slot transitions.
    const hitsTerminalBoundary =
      rawInsertIdx === mids.length || prev === mids.length || rawInsertIdx === 0 || prev === 0
    if (!hitsTerminalBoundary) {
      const boundaryIdx = rawInsertIdx > prev ? prev : rawInsertIdx
      const boundaryMid = mids[Math.min(Math.max(boundaryIdx, 0), mids.length - 1)]
      if (Math.abs(e.clientY - boundaryMid) < 6) {
        stabilizedInsertIdx = prev
      }
    }
  }
  dropInsertIndex.value = stabilizedInsertIdx
  applyIndicatorFromInsertIndex(stabilizedInsertIdx)
}

function onActiveListDrop (e: DragEvent) {
  const from = draggedActiveAttr.value
  const insertFromIndicator = dropInsertIndex.value
  if (from == null || insertFromIndicator == null) return
  commitActiveReorder(from, insertFromIndicator)
}

function commitActiveReorder (from: AssignmentAttribute, insertFromIndicator: number) {
  const next = [...draftActive.value]
  const fromIdx = next.indexOf(from)
  if (fromIdx < 0) return
  let insertIdx = insertFromIndicator
  if (fromIdx < insertIdx) insertIdx -= 1
  if (insertIdx === fromIdx) {
    draggedActiveAttr.value = null
    dropIndicator.value = null
    dropListEdge.value = null
    dropInsertIndex.value = null
    removeDragGhost()
    return
  }
  next.splice(fromIdx, 1)
  next.splice(insertIdx, 0, from)
  draggedActiveAttr.value = null
  dropIndicator.value = null
  dropListEdge.value = null
  dropInsertIndex.value = null
  removeDragGhost()
  draftActive.value = next
  persistDraft()
}

function onActiveSectionDragOver (e: DragEvent) {
  if (draggedActiveAttr.value == null) return
  const section = e.currentTarget
  if (!(section instanceof HTMLElement)) return
  const list = section.querySelector<HTMLElement>('.assignment-settings-overlay__list')
  const listRect = list?.getBoundingClientRect() ?? null
  const overListY = listRect != null && e.clientY >= listRect.top && e.clientY <= listRect.bottom
  if (!overListY) {
    const insertIdx = listRect != null && e.clientY < listRect.top
      ? 0
      : draftActive.value.length
    dropInsertIndex.value = insertIdx
    // Keep drop behavior, but hide the target line outside working area.
    dropListEdge.value = null
    dropIndicator.value = null
  }
}

function onActiveSectionDrop (e: DragEvent) {
  const from = draggedActiveAttr.value
  const section = e.currentTarget
  if (!(section instanceof HTMLElement)) return
  const list = section.querySelector<HTMLElement>('.assignment-settings-overlay__list')
  const listRect = list?.getBoundingClientRect() ?? null
  const overListY = listRect != null && e.clientY >= listRect.top && e.clientY <= listRect.bottom
  let insertFromIndicator = dropInsertIndex.value
  if (insertFromIndicator == null && listRect != null) {
    if (e.clientY < listRect.top) {
      insertFromIndicator = 0
    } else if (e.clientY > listRect.bottom) {
      insertFromIndicator = draftActive.value.length
    } else if (list instanceof HTMLElement) {
      insertFromIndicator = computeInsertIndexFromCursor(list, e.clientY).insertIdx
    }
  }
  if (from == null || insertFromIndicator == null) return
  commitActiveReorder(from, insertFromIndicator)
}

function onOverlayDragOver (e: DragEvent) {
  if (draggedActiveAttr.value == null) return
  const overlay = e.currentTarget
  if (!(overlay instanceof HTMLElement)) return
  const list = overlay.querySelector<HTMLElement>('.assignment-settings-overlay__list')
  const listRect = list?.getBoundingClientRect() ?? null
  if (listRect == null) return
  const overListY = e.clientY >= listRect.top && e.clientY <= listRect.bottom
  if (overListY) return
  dropInsertIndex.value = e.clientY < listRect.top ? 0 : draftActive.value.length
  // Keep drop behavior, but hide target lines outside working area.
  dropListEdge.value = null
  dropIndicator.value = null
}

function onOverlayDrop (e: DragEvent) {
  const from = draggedActiveAttr.value
  if (from == null) return
  const overlay = e.currentTarget
  if (!(overlay instanceof HTMLElement)) return
  const list = overlay.querySelector<HTMLElement>('.assignment-settings-overlay__list')
  const listRect = list?.getBoundingClientRect() ?? null
  if (listRect == null) return
  const overListY = e.clientY >= listRect.top && e.clientY <= listRect.bottom
  if (overListY) return
  const insertFromIndicator = e.clientY < listRect.top ? 0 : draftActive.value.length
  commitActiveReorder(from, insertFromIndicator)
}

function onClose () {
  emit('close')
}

function onBackdropPointerDown (e: PointerEvent) {
  if (e.target === e.currentTarget) onClose()
}

function onKeydown (e: KeyboardEvent) {
  if (e.key === 'Escape') onClose()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  void nextTick(() => {
    shellVisible.value = true
  })
})

onBeforeUnmount(() => {
  for (const timer of moveTimers.values()) {
    clearTimeout(timer)
  }
  moveTimers.clear()
  removeDragGhost()
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="assignment-settings-overlay-root">
      <Transition name="assignment-settings-backdrop">
        <div
          v-if="shellVisible"
          class="assignment-settings-overlay__backdrop"
          @pointerdown="onBackdropPointerDown"
        />
      </Transition>
      <Transition name="assignment-settings-panel">
        <div
          v-if="shellVisible"
          class="assignment-settings-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Assignment settings"
          @dragover.prevent="onOverlayDragOver"
          @drop.prevent="onOverlayDrop"
        >
          <header class="assignment-settings-overlay__header">
            <span class="assignment-settings-overlay__header-icon" aria-hidden="true">
              <img
                class="assignment-settings-overlay__header-icon-image"
                :src="assignmentIconUrl"
                alt=""
              >
            </span>
            <h2 class="assignment-settings-overlay__title">Assignment Settings</h2>
            <span class="assignment-settings-overlay__header-divider" aria-hidden="true" />
            <CloseButton aria-label="Close dialog" @click="onClose" />
          </header>

          <p class="assignment-settings-overlay__intro">
            Activate attributes to use them as a condition for job template
            assignment. Reorder active attributes to give them priority.
          </p>

          <div class="assignment-settings-overlay__sections">
            <section
              class="assignment-settings-overlay__section"
              @dragover.prevent="onActiveSectionDragOver"
              @drop.prevent="onActiveSectionDrop"
            >
              <TransitionGroup
                name="assignment-settings-overlay__row"
                tag="div"
                class="assignment-settings-overlay__list"
                :class="{
                  'assignment-settings-overlay__list--drop-start':
                    dropListEdge === 'start',
                  'assignment-settings-overlay__list--drop-end':
                    dropListEdge === 'end'
                }"
                @dragover.prevent="onActiveListDragOver"
                @drop.prevent="onActiveListDrop($event)"
              >
                <div
                  v-for="attr in orderedAttributes"
                  :key="attr"
                  class="assignment-settings-overlay__row"
                  :class="{
                    'assignment-settings-overlay__row--active': isActiveAttribute(attr),
                    'assignment-settings-overlay__row--drop-before':
                      dropIndicator?.attr === attr &&
                      dropIndicator?.position === 'before',
                    'assignment-settings-overlay__row--drop-after':
                      dropIndicator?.attr === attr &&
                      dropIndicator?.position === 'after'
                  }"
                  :draggable="isActiveAttribute(attr)"
                  @dragstart="onActiveDragStart($event, attr)"
                  @dragend="onActiveDragEnd"
                >
                  <div class="assignment-settings-overlay__row-left">
                    <span
                      v-if="isActiveAttribute(attr)"
                      class="assignment-settings-overlay__drag-handle"
                      aria-hidden="true"
                    >
                      =
                    </span>
                    <span class="assignment-settings-overlay__row-label">{{ LABELS[attr] }}</span>
                  </div>
                  <ToggleSwitch
                    :model-value="rowToggleValue(attr, isActiveAttribute(attr))"
                    :aria-label="isActiveAttribute(attr) ? 'Deactivate attribute' : 'Activate attribute'"
                    @update:model-value="(v) => {
                      if (v) {
                        beginMoveToActive(attr)
                      } else {
                        beginMoveToInactive(attr)
                      }
                    }"
                  />
                </div>
              </TransitionGroup>
              <Transition name="assignment-settings-overlay__empty">
                <div v-if="draftActive.length === 0" class="assignment-settings-overlay__empty">
                  No active assignment attributes yet.
                </div>
              </Transition>
            </section>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.assignment-settings-overlay-root {
  position: fixed;
  inset: 0;
  z-index: 10030;
  pointer-events: none;
}

.assignment-settings-overlay__backdrop {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.35);
  pointer-events: auto;
}

.assignment-settings-overlay {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  box-sizing: border-box;
  width: min(450px, calc(100vw - 24px));
  height: min(388px, calc(100vh - 24px));
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 15px 25px 25px;
  border-radius: 25px;
  background-color: var(--color-white);
  -webkit-backdrop-filter: blur(40px);
  backdrop-filter: blur(40px);
  box-shadow: 0 7px 22px 0 rgba(0, 0, 0, 0.25);
  pointer-events: auto;
  overflow: auto;
}

.assignment-settings-overlay__header {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.assignment-settings-overlay__header-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 13px;
  height: 14.5px;
}

.assignment-settings-overlay__header-icon-image {
  display: block;
  width: 13px;
  height: 14.5px;
}

.assignment-settings-overlay__title {
  margin: 0;
  flex: 1 1 auto;
  font-family: var(--font-family-base);
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: -0.015px;
  color: #111111;
}

.assignment-settings-overlay__header-divider {
  width: 1px;
  height: 17px;
  background-color: var(--color-border-strong);
}

.assignment-settings-overlay__intro,
.assignment-settings-overlay__empty,
.assignment-settings-overlay__row-label,
.assignment-settings-overlay__drag-handle {
  margin: 0;
  font-family: var(--font-family-base);
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  letter-spacing: 0.06px;
}

.assignment-settings-overlay__intro,
.assignment-settings-overlay__empty {
  color: #737373;
}

.assignment-settings-overlay__sections {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.assignment-settings-overlay__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.assignment-settings-overlay__list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.assignment-settings-overlay__list--drop-start::before,
.assignment-settings-overlay__list--drop-end::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background-color: var(--color-primary);
  pointer-events: none;
}

.assignment-settings-overlay__list--drop-start::before {
  top: -5px;
}

.assignment-settings-overlay__list--drop-end::after {
  bottom: -5px;
}

.assignment-settings-overlay__row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
  height: 30px;
  padding: 3px 0;
  box-sizing: border-box;
  border-radius: 8px;
  background-color: #fefefe;
}

.assignment-settings-overlay__row--drop-before::before,
.assignment-settings-overlay__row--drop-after::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background-color: var(--color-primary);
  pointer-events: none;
}

.assignment-settings-overlay__row--drop-before::before {
  top: -5px;
}

.assignment-settings-overlay__row--drop-after::after {
  bottom: -5px;
}

.assignment-settings-overlay__row-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.assignment-settings-overlay__drag-handle {
  color: #a4a4a4;
  flex-shrink: 0;
  width: 8px;
  text-align: center;
}

.assignment-settings-overlay__row-label {
  color: #474747;
}

.assignment-settings-overlay__row[draggable='true'] {
  cursor: grab;
}

.assignment-settings-overlay__row[draggable='true']:active {
  cursor: grabbing;
}

.assignment-settings-overlay__row-enter-active,
.assignment-settings-overlay__row-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.assignment-settings-overlay__row-move {
  transition: transform 0.2s ease;
}

.assignment-settings-overlay__row-enter-from,
.assignment-settings-overlay__row-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.assignment-settings-overlay__row-leave-active {
  position: absolute;
}

.assignment-settings-overlay__empty-enter-active,
.assignment-settings-overlay__empty-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.assignment-settings-overlay__empty-enter-from,
.assignment-settings-overlay__empty-leave-to {
  opacity: 0;
  transform: translateY(3px);
}

.assignment-settings-overlay__header :deep(.close-button) {
  width: 30px;
  height: 30px;
}

.assignment-settings-overlay__header :deep(.close-button__glyph) {
  width: 10.7px;
  height: 10.7px;
}

.assignment-settings-overlay__header :deep(.close-button--default .close-button__glyph) {
  background-color: #595959;
}

.assignment-settings-overlay__header :deep(.close-button--hover .close-button__glyph) {
  background-color: #2f2f2f;
}

.assignment-settings-overlay__header :deep(.close-button--hover .close-button__bg) {
  background-color: #f1f1f4;
}

.assignment-settings-backdrop-enter-active,
.assignment-settings-backdrop-leave-active,
.assignment-settings-panel-enter-active,
.assignment-settings-panel-leave-active {
  transition: opacity 0.2s ease;
}

.assignment-settings-panel-enter-active,
.assignment-settings-panel-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.assignment-settings-backdrop-enter-from,
.assignment-settings-backdrop-leave-to,
.assignment-settings-panel-enter-from,
.assignment-settings-panel-leave-to {
  opacity: 0;
}

.assignment-settings-panel-enter-from,
.assignment-settings-panel-leave-to {
  transform: translate(-50%, -50%) scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .assignment-settings-backdrop-enter-active,
  .assignment-settings-backdrop-leave-active,
  .assignment-settings-panel-enter-active,
  .assignment-settings-panel-leave-active {
    transition: none;
  }
}
</style>
