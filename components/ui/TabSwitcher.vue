<script setup lang="ts">
/**
 * Tab switcher — Figma: TabSwitcher (node 82:5943)
 * Two options; click inactive to switch. Active: primary + animated underline to label width.
 */
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 0 = first option, 1 = second */
    modelValue?: number
    option1Label?: string
    option2Label?: string
    /** When true, first tab is not selectable (e.g. Conditions on default template) */
    option1Disabled?: boolean
  }>(),
  {
    modelValue: 0,
    option1Label: 'Option 1',
    option2Label: 'Option 2',
    option1Disabled: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const rootRef = ref<HTMLElement | null>(null)
const label0Ref = ref<HTMLElement | null>(null)
const label1Ref = ref<HTMLElement | null>(null)

const underlineLeft = ref(0)
const underlineWidth = ref(0)
/** Off until first layout is painted so the underline does not animate from 0×0 on appear. */
const underlineTransitionEnabled = ref(false)

function measure () {
  const root = rootRef.value
  const labelEl = props.modelValue === 0 ? label0Ref.value : label1Ref.value
  if (!root || !labelEl) return
  const r = root.getBoundingClientRect()
  const l = labelEl.getBoundingClientRect()
  underlineLeft.value = l.left - r.left
  underlineWidth.value = l.width
  if (!underlineTransitionEnabled.value && l.width > 0) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        underlineTransitionEnabled.value = true
      })
    })
  }
}

function scheduleMeasure () {
  nextTick(() => {
    requestAnimationFrame(measure)
  })
}

function onSelect (index: 0 | 1) {
  if (index === 0 && props.option1Disabled) return
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
    [props.modelValue, props.option1Label, props.option2Label, props.option1Disabled] as const,
  () => scheduleMeasure(),
  { flush: 'post' }
)

const underlineStyle = computed(() => ({
  left: `${underlineLeft.value}px`,
  width: `${underlineWidth.value}px`
}))
</script>

<template>
  <div ref="rootRef" class="tab-switcher">
    <div class="tab-switcher__tabs" role="tablist" aria-label="Tab options">
      <button
        type="button"
        class="tab-switcher__tab"
        :class="{ 'tab-switcher__tab--active': modelValue === 0 }"
        role="tab"
        :aria-selected="modelValue === 0"
        :aria-disabled="option1Disabled"
        :disabled="option1Disabled"
        :tabindex="option1Disabled ? -1 : 0"
        @click="onSelect(0)"
      >
        <span ref="label0Ref" class="tab-switcher__label">{{ option1Label }}</span>
      </button>
      <button
        type="button"
        class="tab-switcher__tab"
        :class="{ 'tab-switcher__tab--active': modelValue === 1 }"
        role="tab"
        :aria-selected="modelValue === 1"
        tabindex="0"
        @click="onSelect(1)"
      >
        <span ref="label1Ref" class="tab-switcher__label">{{ option2Label }}</span>
      </button>
    </div>
    <div
      class="tab-switcher__underline"
      :class="{ 'tab-switcher__underline--transition': underlineTransitionEnabled }"
      aria-hidden="true"
      :style="underlineStyle"
    />
  </div>
</template>

<style scoped>
.tab-switcher {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  max-width: 100%;
  font-family: var(--font-family-base);
}

.tab-switcher__tabs {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 15px;
  width: 100%;
}

.tab-switcher__tab {
  margin: 0;
  padding: 0 0 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-strong);
  line-height: var(--typography-body-xl-line-height-strong);
  letter-spacing: var(--typography-body-xl-letter-spacing-strong);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.tab-switcher__tab--active {
  color: var(--color-primary);
}

.tab-switcher__tab:disabled {
  cursor: not-allowed;
  opacity: 0.45;
  color: var(--color-text-tertiary);
}

.tab-switcher__tab:disabled.tab-switcher__tab--active {
  color: var(--color-text-tertiary);
}

.tab-switcher__tab:focus {
  outline: none;
}

.tab-switcher__tab:focus-visible {
  border-radius: 2px;
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

.tab-switcher__label {
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.tab-switcher__underline {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 1px;
  background-color: var(--color-primary);
  pointer-events: none;
}

.tab-switcher__underline--transition {
  transition:
    left 0.25s ease,
    width 0.25s ease;
}
</style>
