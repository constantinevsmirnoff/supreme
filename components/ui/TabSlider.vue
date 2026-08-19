<script setup lang="ts">
/**
 * Tab slider (segmented control) — Figma: Tab Slider (node 163:2204)
 * Track uses kit background; white thumb animates to the selected tab.
 */
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: number
    option1Label?: string
    option2Label?: string
    option3Label?: string
    option1Disabled?: boolean
    option3Disabled?: boolean
  }>(),
  {
    modelValue: 0,
    option1Label: 'Option 1',
    option2Label: 'Option 2',
    option3Label: '',
    option1Disabled: false,
    option3Disabled: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const rootRef = ref<HTMLElement | null>(null)
const tab0Ref = ref<HTMLElement | null>(null)
const tab1Ref = ref<HTMLElement | null>(null)
const tab2Ref = ref<HTMLElement | null>(null)

const hasThreeTabs = computed(() => props.option3Label.trim().length > 0)

const thumbLeft = ref(0)
const thumbTop = ref(0)
const thumbWidth = ref(0)
const thumbHeight = ref(0)
const thumbTransitionEnabled = ref(false)

function measure () {
  const root = rootRef.value
  const tabEl =
    props.modelValue === 0
      ? tab0Ref.value
      : props.modelValue === 1
        ? tab1Ref.value
        : tab2Ref.value
  if (!root || !tabEl) return
  const r = root.getBoundingClientRect()
  const t = tabEl.getBoundingClientRect()
  thumbLeft.value = t.left - r.left
  thumbTop.value = t.top - r.top
  thumbWidth.value = t.width
  thumbHeight.value = t.height
  if (!thumbTransitionEnabled.value && t.width > 0) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        thumbTransitionEnabled.value = true
      })
    })
  }
}

function scheduleMeasure () {
  nextTick(() => {
    requestAnimationFrame(measure)
  })
}

function onSelect (index: 0 | 1 | 2) {
  if (index === 0 && props.option1Disabled) return
  if (index === 2 && props.option3Disabled) return
  if (index === props.modelValue) return
  emit('update:modelValue', index)
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  window.addEventListener('resize', measure)
  nextTick(() => {
    measure()
    if (typeof ResizeObserver !== 'undefined' && rootRef.value) {
      resizeObserver = new ResizeObserver(() => measure())
      resizeObserver.observe(rootRef.value)
    }
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measure)
  resizeObserver?.disconnect()
})

watch(
  () =>
    [
      props.modelValue,
      props.option1Label,
      props.option2Label,
      props.option3Label,
      props.option1Disabled,
      props.option3Disabled,
      hasThreeTabs.value
    ] as const,
  () => scheduleMeasure(),
  { flush: 'post' }
)

const thumbStyle = computed(() => ({
  left: `${thumbLeft.value}px`,
  top: `${thumbTop.value}px`,
  width: `${thumbWidth.value}px`,
  height: `${thumbHeight.value}px`
}))
</script>

<template>
  <div ref="rootRef" class="tab-slider">
    <div
      class="tab-slider__thumb"
      :class="{ 'tab-slider__thumb--transition': thumbTransitionEnabled }"
      aria-hidden="true"
      :style="thumbStyle"
    />
    <div class="tab-slider__tabs" role="tablist" aria-label="Tab options">
      <button
        ref="tab0Ref"
        type="button"
        class="tab-slider__tab"
        :class="{ 'tab-slider__tab--active': modelValue === 0 }"
        role="tab"
        :aria-selected="modelValue === 0"
        :aria-disabled="option1Disabled"
        :disabled="option1Disabled"
        :tabindex="option1Disabled ? -1 : 0"
        @click="onSelect(0)"
      >
        <span class="tab-slider__label">{{ option1Label }}</span>
      </button>
      <button
        ref="tab1Ref"
        type="button"
        class="tab-slider__tab"
        :class="{ 'tab-slider__tab--active': modelValue === 1 }"
        role="tab"
        :aria-selected="modelValue === 1"
        tabindex="0"
        @click="onSelect(1)"
      >
        <span class="tab-slider__label">{{ option2Label }}</span>
      </button>
      <button
        v-if="hasThreeTabs"
        ref="tab2Ref"
        type="button"
        class="tab-slider__tab"
        :class="{ 'tab-slider__tab--active': modelValue === 2 }"
        role="tab"
        :aria-selected="modelValue === 2"
        :aria-disabled="option3Disabled"
        :disabled="option3Disabled"
        :tabindex="option3Disabled ? -1 : 0"
        @click="onSelect(2)"
      >
        <span class="tab-slider__label">{{ option3Label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.tab-slider {
  position: relative;
  box-sizing: border-box;
  display: flex;
  width: fit-content;
  max-width: 100%;
  padding: var(--space-3xs);
  border-radius: var(--radius-tab-slider);
  background-color: var(--color-border-light);
  font-family: var(--font-family-base);
}

.tab-slider__thumb {
  position: absolute;
  box-sizing: border-box;
  border-radius: var(--radius-tab-slider-thumb);
  background-color: var(--color-white);
  box-shadow: var(--shadow-tab-slider-thumb);
  pointer-events: none;
  z-index: 0;
}

.tab-slider__thumb--transition {
  transition:
    left 0.22s cubic-bezier(0.25, 0.1, 0.25, 1),
    top 0.22s cubic-bezier(0.25, 0.1, 0.25, 1),
    width 0.22s cubic-bezier(0.25, 0.1, 0.25, 1),
    height 0.22s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.tab-slider__tabs {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: stretch;
  justify-content: flex-start;
  gap: var(--space-3xs);
  width: auto;
  flex: 0 0 auto;
  min-width: 0;
}

.tab-slider__tab {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 var(--width-tab-slider-tab);
  align-items: center;
  justify-content: center;
  width: var(--width-tab-slider-tab);
  min-width: var(--width-tab-slider-tab);
  margin: 0;
  padding: var(--space-sm) var(--space-md);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.tab-slider__tab--active {
  color: var(--color-text-primary);
}

.tab-slider__tab:disabled {
  cursor: not-allowed;
  opacity: 0.45;
  color: var(--color-text-tertiary);
}

.tab-slider__tab:disabled.tab-slider__tab--active {
  color: var(--color-text-tertiary);
}

.tab-slider__tab:focus {
  outline: none;
}

.tab-slider__tab:focus-visible {
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

.tab-slider__label {
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
</style>
