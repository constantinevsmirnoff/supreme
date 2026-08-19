<script setup lang="ts">
/**
 * Condition filter pill — text only; values render comma-separated; narrow width shows +N for hidden entries.
 */
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'company' | 'industry' | 'location' | 'title' | 'template' | 'status'
    /** Single-line fallback when `values` is empty */
    label?: string
    /** Prefer passing discrete values (comma-joined in UI); empty uses `label` / defaults */
    values?: string[]
    /** Muted presentation (e.g. default template on Page Manager) */
    inactive?: boolean
    /** Show remove control; emits `dismiss` when clicked */
    removable?: boolean
  }>(),
  { variant: 'location', label: '', values: undefined, inactive: false, removable: false }
)

const emit = defineEmits<{
  dismiss: []
}>()

const defaultLabels: Record<NonNullable<typeof props.variant>, string> = {
  company: 'Olsen & Breuner',
  industry: 'Finance',
  location: 'Frankfurt',
  title: 'Any job title',
  template: 'Template',
  status: 'Active'
}

function onDismissClick (e: MouseEvent) {
  e.stopPropagation()
  emit('dismiss')
}

const normalizedValues = computed(() => {
  const raw = props.values
  if (raw != null && raw.length > 0) return raw.map((s) => s.trim()).filter(Boolean)
  const L = (props.label || '').trim()
  if (L) return [L]
  return [defaultLabels[props.variant]]
})

const fullLabelForA11y = computed(() => normalizedValues.value.join(', '))

const labelRowRef = ref<HTMLElement | null>(null)
const labelTextRef = ref<HTMLElement | null>(null)

/** How many values from the start are shown before +N (only used when length >= 2). */
const fitCount = ref(1)

let canvasEl: HTMLCanvasElement | null = null
function measureTextWidth (text: string, fontCss: string): number {
  if (!canvasEl) canvasEl = document.createElement('canvas')
  const ctx = canvasEl.getContext('2d')
  if (!ctx) return 0
  ctx.font = fontCss
  return ctx.measureText(text).width
}

function lineForK (vals: string[], k: number): string {
  const n = vals.length
  if (n === 0) return ''
  if (k >= n) return vals.join(', ')
  return vals.slice(0, k).join(', ') + ` +${n - k}`
}

function measureFit () {
  const vals = normalizedValues.value
  const n = vals.length
  const row = labelRowRef.value
  const textEl = labelTextRef.value
  if (!row || !textEl || n === 0) {
    if (n >= 2) fitCount.value = n
    return
  }

  if (n === 1) {
    fitCount.value = 1
    return
  }

  const font = getComputedStyle(textEl).font
  const available = row.clientWidth
  if (available <= 1) {
    fitCount.value = n
    return
  }

  let best = 1
  for (let k = n; k >= 1; k--) {
    const line = lineForK(vals, k)
    if (measureTextWidth(line, font) <= available) {
      best = k
      break
    }
  }
  fitCount.value = best
}

let ro: ResizeObserver | null = null

function scheduleMeasure () {
  nextTick(() => {
    requestAnimationFrame(measureFit)
  })
}

watch(
  normalizedValues,
  (vals) => {
    const n = vals.length
    fitCount.value = n >= 2 ? n : 1
    scheduleMeasure()
  },
  { deep: true, immediate: true }
)

function connectResizeObserver () {
  ro?.disconnect()
  ro = null
  const el = labelRowRef.value
  if (el && typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => scheduleMeasure())
    ro.observe(el)
  }
}

watch(labelRowRef, () => {
  connectResizeObserver()
  scheduleMeasure()
})

onMounted(() => {
  nextTick(() => {
    connectResizeObserver()
    scheduleMeasure()
  })
})

onBeforeUnmount(() => {
  ro?.disconnect()
})

const displayParts = computed(() => {
  const vals = normalizedValues.value
  const n = vals.length
  if (n === 0) return { main: '', plus: null as string | null }
  if (n === 1) return { main: vals[0], plus: null }
  const k = Math.min(Math.max(fitCount.value, 1), n)
  if (k >= n) return { main: vals.join(', '), plus: null }
  return {
    main: vals.slice(0, k).join(', '),
    plus: `+${n - k}`
  }
})
</script>

<template>
  <div
    class="condition-pill"
    :class="{ 'condition-pill--inactive': inactive, 'condition-pill--removable': removable }"
    :aria-label="fullLabelForA11y"
  >
    <div
      ref="labelRowRef"
      class="condition-pill__label-row"
    >
      <span
        ref="labelTextRef"
        class="condition-pill__label"
        :class="{ 'condition-pill__label--single': normalizedValues.length <= 1 }"
        :title="fullLabelForA11y"
      >
        <span class="condition-pill__label-main">{{ displayParts.main }}</span>
        <template v-if="displayParts.plus">
          <span class="condition-pill__label-gap">&nbsp;</span>
          <span class="condition-pill__label-plus">{{ displayParts.plus }}</span>
        </template>
      </span>
    </div>
    <button
      v-if="removable"
      type="button"
      class="condition-pill__dismiss"
      aria-label="Remove filter"
      @click="onDismissClick"
    >
      <span class="condition-pill__dismiss-icon" aria-hidden="true">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
        </svg>
      </span>
    </button>
  </div>
</template>

<style scoped>
.condition-pill {
  box-sizing: border-box;
  display: inline-flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 2px;
  width: fit-content;
  max-width: 100%;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid var(--color-border-light);
  background-color: var(--color-background-secondary);
}

.condition-pill--removable {
  max-width: min(100%, 280px);
}

.condition-pill__label-row {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.condition-pill__label {
  min-width: 0;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.condition-pill__label--single {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.condition-pill__label-main {
  white-space: nowrap;
  color: var(--color-text-tertiary);
}

.condition-pill__label-gap {
  white-space: nowrap;
}

.condition-pill__label-plus {
  white-space: nowrap;
}

.condition-pill--inactive {
  background-color: var(--color-background-tertiary);
}

.condition-pill--inactive .condition-pill__label {
  color: var(--color-text-tertiary);
}

.condition-pill__dismiss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  margin: 0;
  margin-left: var(--space-2xs);
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
}

.condition-pill__dismiss:focus {
  outline: none;
}

.condition-pill__dismiss:focus-visible {
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

.condition-pill__dismiss:hover {
  color: var(--color-text-secondary);
  background-color: var(--color-background-tertiary);
}

.condition-pill__dismiss-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
