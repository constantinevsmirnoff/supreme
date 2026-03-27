<script lang="ts">
let conditionPillUidSeq = 0
</script>

<script setup lang="ts">
/**
 * Condition filter pill — Figma: ConditionPill (node 67:6365)
 * Values render comma-separated; when space is tight, truncates whole values and appends +N (same type as the label).
 */
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'company' | 'industry' | 'location'
    /** Single-line fallback when `values` is empty */
    label?: string
    /** Prefer passing discrete values (comma-joined in UI); empty uses `label` / defaults */
    values?: string[]
    /** Muted presentation (e.g. default template on Page Manager) */
    inactive?: boolean
  }>(),
  { variant: 'location', label: '', values: undefined, inactive: false }
)

const uid = `condition-pill-${++conditionPillUidSeq}`
const industryGradientId = `${uid}-industry-fill`
const locationGradientId = `${uid}-location-fill`

const defaultLabels: Record<typeof props.variant, string> = {
  company: 'Olsen & Breuner',
  industry: 'Finance',
  location: 'Frankfurt'
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
    :class="{ 'condition-pill--inactive': inactive }"
    :aria-label="fullLabelForA11y"
  >
    <span class="condition-pill__icon" aria-hidden="true">
      <!-- Company -->
      <svg
        v-if="variant === 'company'"
        class="condition-pill__svg"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="20" height="20" rx="4" class="condition-pill__icon-bg" />
        <path
          d="M4.14282 15.2126C4.14282 15.0802 4.19116 14.9656 4.28784 14.8689C4.38452 14.7722 4.4991 14.7239 4.63159 14.7239H15.363C15.4991 14.7239 15.6155 14.7722 15.7122 14.8689C15.8088 14.9656 15.8572 15.0802 15.8572 15.2126C15.8572 15.3487 15.8088 15.4651 15.7122 15.5618C15.6155 15.662 15.4991 15.7122 15.363 15.7122H4.63159C4.4991 15.7122 4.38452 15.662 4.28784 15.5618C4.19116 15.4651 4.14282 15.3487 4.14282 15.2126ZM5.07202 9.10034V8.96606C5.07202 8.84432 5.10604 8.74764 5.17407 8.67603C5.24569 8.60441 5.34416 8.5686 5.46948 8.5686H6.80151C6.93042 8.5686 7.03068 8.60441 7.10229 8.67603C7.17391 8.74764 7.20972 8.84432 7.20972 8.96606V9.10034C7.20972 9.22209 7.17391 9.31877 7.10229 9.39038C7.03068 9.462 6.93042 9.4978 6.80151 9.4978H5.46948C5.34416 9.4978 5.24569 9.462 5.17407 9.39038C5.10604 9.31877 5.07202 9.22209 5.07202 9.10034ZM5.67358 13.5583V9.11108H6.60278V13.5583H5.67358ZM5.07202 13.8376V13.7034C5.07202 13.5816 5.10604 13.4849 5.17407 13.4133C5.24569 13.3417 5.34416 13.3059 5.46948 13.3059H6.80151C6.93042 13.3059 7.03068 13.3417 7.10229 13.4133C7.17391 13.4849 7.20972 13.5816 7.20972 13.7034V13.8376C7.20972 13.963 7.17391 14.0614 7.10229 14.1331C7.03068 14.2047 6.93042 14.2405 6.80151 14.2405H5.46948C5.34416 14.2405 5.24569 14.2047 5.17407 14.1331C5.10604 14.0614 5.07202 13.963 5.07202 13.8376ZM7.65552 9.10034V8.96606C7.65552 8.84432 7.69132 8.74764 7.76294 8.67603C7.83455 8.60441 7.93302 8.5686 8.05835 8.5686H9.39038C9.51571 8.5686 9.61418 8.60441 9.68579 8.67603C9.75741 8.74764 9.79321 8.84432 9.79321 8.96606V9.10034C9.79321 9.22209 9.75741 9.31877 9.68579 9.39038C9.61418 9.462 9.51571 9.4978 9.39038 9.4978H8.05835C7.93302 9.4978 7.83455 9.462 7.76294 9.39038C7.69132 9.31877 7.65552 9.22209 7.65552 9.10034ZM8.26782 13.5583V9.11108H9.19702V13.5583H8.26782ZM7.65552 13.8376V13.7034C7.65552 13.5816 7.69132 13.4849 7.76294 13.4133C7.83455 13.3417 7.93302 13.3059 8.05835 13.3059H9.39038C9.51571 13.3059 9.61418 13.3417 9.68579 13.4133C9.75741 13.4849 9.79321 13.5816 9.79321 13.7034V13.8376C9.79321 13.963 9.75741 14.0614 9.68579 14.1331C9.61418 14.2047 9.51571 14.2405 9.39038 14.2405H8.05835C7.93302 14.2405 7.83455 14.2047 7.76294 14.1331C7.69132 14.0614 7.65552 13.963 7.65552 13.8376ZM10.2498 9.10034V8.96606C10.2498 8.84432 10.2856 8.74764 10.3572 8.67603C10.4288 8.60441 10.5273 8.5686 10.6526 8.5686H11.9846C12.1099 8.5686 12.2084 8.60441 12.28 8.67603C12.3516 8.74764 12.3875 8.84432 12.3875 8.96606V9.10034C12.3875 9.22209 12.3516 9.31877 12.28 9.39038C12.2084 9.462 12.1099 9.4978 11.9846 9.4978H10.6526C10.5273 9.4978 10.4288 9.462 10.3572 9.39038C10.2856 9.31877 10.2498 9.22209 10.2498 9.10034ZM10.8567 13.5583V9.11108H11.7859V13.5583H10.8567ZM10.2498 13.8376V13.7034C10.2498 13.5816 10.2856 13.4849 10.3572 13.4133C10.4288 13.3417 10.5273 13.3059 10.6526 13.3059H11.9846C12.1099 13.3059 12.2084 13.3417 12.28 13.4133C12.3516 13.4849 12.3875 13.5816 12.3875 13.7034V13.8376C12.3875 13.963 12.3516 14.0614 12.28 14.1331C12.2084 14.2047 12.1099 14.2405 11.9846 14.2405H10.6526C10.5273 14.2405 10.4288 14.2047 10.3572 14.1331C10.2856 14.0614 10.2498 13.963 10.2498 13.8376ZM12.8386 9.10034V8.96606C12.8386 8.84432 12.8744 8.74764 12.946 8.67603C13.0177 8.60441 13.1161 8.5686 13.2415 8.5686H14.5735C14.6988 8.5686 14.7973 8.60441 14.8689 8.67603C14.9405 8.74764 14.9763 8.84432 14.9763 8.96606V9.10034C14.9763 9.22209 14.9405 9.31877 14.8689 9.39038C14.7973 9.462 14.6988 9.4978 14.5735 9.4978H13.2415C13.1161 9.4978 13.0177 9.462 12.946 9.39038C12.8744 9.31877 12.8386 9.22209 12.8386 9.10034ZM13.4456 13.5583V9.11108H14.3748V13.5583H13.4456ZM12.8386 13.8376V13.7034C12.8386 13.5816 12.8744 13.4849 12.946 13.4133C13.0177 13.3417 13.1161 13.3059 13.2415 13.3059H14.5735C14.6988 13.3059 14.7973 13.3417 14.8689 13.4133C14.9405 13.4849 14.9763 13.5816 14.9763 13.7034V13.8376C14.9763 13.963 14.9405 14.0614 14.8689 14.1331C14.7973 14.2047 14.6988 14.2405 14.5735 14.2405H13.2415C13.1161 14.2405 13.0177 14.2047 12.946 14.1331C12.8744 14.0614 12.8386 13.963 12.8386 13.8376ZM4.93237 8.09058C4.76766 8.09058 4.63875 8.04224 4.54565 7.94556C4.45256 7.8453 4.40601 7.73071 4.40601 7.60181C4.40601 7.50155 4.43107 7.41203 4.4812 7.33325C4.53491 7.25448 4.61548 7.18465 4.7229 7.12378L9.30981 4.4812C9.5354 4.35229 9.76457 4.28784 9.99731 4.28784C10.2301 4.28784 10.461 4.35229 10.6902 4.4812L15.2771 7.12378C15.3809 7.18465 15.4579 7.25448 15.5081 7.33325C15.5618 7.41203 15.5886 7.50155 15.5886 7.60181C15.5886 7.73071 15.5421 7.8453 15.449 7.94556C15.3595 8.04224 15.2306 8.09058 15.0623 8.09058H4.93237Z"
          class="condition-pill__icon-fg"
        />
      </svg>
      <!-- Industry -->
      <svg
        v-else-if="variant === 'industry'"
        class="condition-pill__svg"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="20" height="20" rx="4" class="condition-pill__icon-bg" />
        <path
          d="M10.7749 15.9499C9.01782 15.9499 7.90237 15.3379 7.81846 14.2767L7.8234 14.2372L7.3792 14.2816C6.51053 14.3606 5.86397 13.8769 5.86397 12.9342V12.0853C5.31118 11.952 5.00024 11.5374 5.00024 11.034C5.00024 10.7626 5.08414 10.4713 5.25195 10.1752L5.87877 9.04496C5.8689 8.92651 5.86397 8.79818 5.86397 8.65011C5.86397 5.89111 7.69014 4.05013 10.4195 4.05013C13.1637 4.05013 14.9998 5.93553 14.9998 8.75376C14.9998 9.95311 14.5506 11.0488 13.7807 11.7349V14.1286C13.7807 15.2786 12.6356 15.9499 10.7749 15.9499ZM8.68713 9.37071C9.25966 9.37071 9.66438 8.99561 9.66438 8.47243C9.66438 8.29475 9.60022 8.13681 9.49657 8.0381C9.4176 7.95419 9.38305 7.87029 9.38305 7.80119C9.38305 7.66793 9.49163 7.56428 9.62983 7.56428C9.69399 7.56428 9.76803 7.58402 9.83219 7.64325C9.86674 7.67286 9.89635 7.72222 9.91609 7.75677C10.2665 7.70248 10.4393 7.48531 10.4393 7.13982C10.4393 6.99669 10.5528 6.87823 10.686 6.87823C10.8292 6.87823 10.9476 7.00162 10.9476 7.13488C10.9476 7.70741 10.6663 8.07265 10.1283 8.20591C10.1579 8.30462 10.1629 8.40827 10.1629 8.51192C10.1579 8.97093 9.9309 9.35097 9.5558 9.57307C9.78777 9.68659 10.0592 9.75075 10.3504 9.75075C10.4639 9.75075 10.5923 9.74088 10.7305 9.7162C10.7107 9.64217 10.6959 9.57307 10.6959 9.49904C10.6959 8.14668 12.6257 7.97394 12.6257 6.79433C12.6257 6.2218 12.1618 5.76279 11.5991 5.76772C11.4215 5.76772 11.3622 5.77266 11.3079 5.78253C11.1006 5.56043 10.8094 5.42223 10.5281 5.42223C10.0543 5.42223 9.7088 5.71837 9.70386 6.16257C9.70386 6.32051 9.60022 6.41922 9.45215 6.41922C9.29914 6.41922 9.19056 6.30077 9.1955 6.14776C9.20537 5.96021 9.25472 5.82201 9.30408 5.69862C9.22511 5.68875 9.15108 5.68382 9.06717 5.68382C8.45516 5.68382 8.01095 6.05892 8.01095 6.51793C8.01095 6.8042 8.21331 7.0263 8.48477 7.0263C8.6279 7.0263 8.74636 7.13982 8.74636 7.28295C8.74636 7.42115 8.6279 7.5396 8.48477 7.5396C8.08499 7.5396 7.77898 7.35699 7.62598 7.07072C7.45323 7.3175 7.35945 7.61857 7.35945 7.92458C7.35945 8.74389 7.8925 9.37071 8.68713 9.37071ZM12.4974 10.7379C13.0453 10.7379 13.4352 10.1357 13.4352 9.27693C13.4352 9.21277 13.4352 9.13874 13.4352 9.07457C13.2378 9.15354 13.0107 9.18809 12.7541 9.17329C12.6159 9.15848 12.5122 9.05483 12.5122 8.91664C12.5122 8.77844 12.6307 8.65505 12.7639 8.66492C13.3019 8.70934 13.6573 8.40333 13.6573 7.91964C13.6573 7.47544 13.4401 7.12008 13.0897 6.90291C12.9268 8.29475 11.15 8.50205 11.15 9.47929C11.15 9.76062 11.3375 9.96298 11.6584 9.96298H11.7324C11.8163 10.422 12.1223 10.7379 12.4974 10.7379Z"
          :fill="`url(#${industryGradientId})`"
        />
        <defs>
          <linearGradient
            :id="industryGradientId"
            x1="10"
            y1="4.05013"
            x2="10"
            y2="15.9499"
            gradientUnits="userSpaceOnUse"
          >
            <stop class="condition-pill__grad-stop condition-pill__grad-stop--soft" />
            <stop offset="1" class="condition-pill__grad-stop condition-pill__grad-stop--strong" />
          </linearGradient>
        </defs>
      </svg>
      <!-- Location -->
      <svg
        v-else
        class="condition-pill__svg"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="20" height="20" rx="4" class="condition-pill__icon-bg" />
        <path
          d="M4.99949 13.5623C4.68671 13.4406 4.59118 13.128 4.71288 12.8153C4.78088 12.6405 4.93501 12.4621 5.07278 12.2986L11.0089 5.56256C11.3135 5.21505 11.5967 5.11339 11.8635 5.21718C12.1257 5.31919 12.2703 5.58729 12.26 6.04934L12.0782 15.0242C12.0738 15.2396 12.0622 15.4734 11.9942 15.6482C11.8725 15.961 11.5909 16.1268 11.2781 16.0051C11.0527 15.9174 10.9377 15.7774 10.7937 15.4671L9.27748 12.0544C9.26343 12.0225 9.24759 11.9951 9.22919 11.988C9.20619 11.979 9.18063 11.9903 9.14868 12.0043L5.72017 13.4932C5.40888 13.6263 5.22488 13.65 4.99949 13.5623Z"
          :fill="`url(#${locationGradientId})`"
        />
        <defs>
          <linearGradient
            :id="locationGradientId"
            x1="11.8612"
            y1="5.21629"
            x2="8.1388"
            y2="14.7837"
            gradientUnits="userSpaceOnUse"
          >
            <stop class="condition-pill__grad-stop condition-pill__grad-stop--soft" />
            <stop offset="1" class="condition-pill__grad-stop condition-pill__grad-stop--strong" />
          </linearGradient>
        </defs>
      </svg>
    </span>
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
  </div>
</template>

<style scoped>
.condition-pill {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2px;
  width: 100%;
  max-width: 100%;
  padding: 3px 4px;
  border-radius: 5px;
  border: 1px solid var(--color-border-strong);
  background-color: var(--color-white);
}

.condition-pill__icon {
  display: flex;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.condition-pill__svg {
  display: block;
  width: 20px;
  height: 20px;
}

.condition-pill__icon-bg {
  fill: var(--color-background-secondary);
}

.condition-pill__icon-fg {
  fill: var(--color-text-secondary);
}

.condition-pill__label-row {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0 6px;
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
  width: 100%;
}

.condition-pill__label-main {
  white-space: nowrap;
}

.condition-pill__label-gap {
  white-space: nowrap;
}

.condition-pill__label-plus {
  white-space: nowrap;
  /* Same typography as .condition-pill__label / __label-main (inherited) */
}

.condition-pill__grad-stop {
  stop-color: var(--color-text-secondary);
}

.condition-pill__grad-stop--soft {
  stop-opacity: 0.32;
}

.condition-pill__grad-stop--strong {
  stop-opacity: 0.81;
}

.condition-pill--inactive {
  border-color: var(--color-border-light);
  background-color: var(--color-background-tertiary);
}

.condition-pill--inactive .condition-pill__icon-bg {
  fill: var(--color-background-secondary);
}

.condition-pill--inactive .condition-pill__icon-fg {
  fill: var(--color-text-tertiary);
}

.condition-pill--inactive .condition-pill__label {
  color: var(--color-text-tertiary);
}

.condition-pill--inactive .condition-pill__grad-stop {
  stop-color: var(--color-text-tertiary);
}

.condition-pill--inactive .condition-pill__grad-stop--soft {
  stop-opacity: 0.22;
}

.condition-pill--inactive .condition-pill__grad-stop--strong {
  stop-opacity: 0.45;
}
</style>
