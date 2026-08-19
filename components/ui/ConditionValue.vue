<script setup lang="ts">
/**
 * Condition value chip — Figma: ConditionValue (node 83:6093)
 * Default: label + X. Optional editable input. Icon: icons/x_small.svg
 */
import { ref, computed, watch } from 'vue'
import xSmallUrl from '@/icons/x_small.svg?url'

const props = withDefaults(
  defineProps<{
    /** Fallback when modelValue is empty (e.g. showcase without v-model) */
    label?: string
    editable?: boolean
    /** No chip background (e.g. thumbnail filename row in JobTemplateOverlay). */
    variant?: 'default' | 'bare'
  }>(),
  { label: 'Frankfurt', editable: false, variant: 'default' }
)

const model = defineModel<string>({ default: '' })

const emit = defineEmits<{
  remove: []
}>()

const isXHovered = ref(false)
const draft = ref('')

const displayText = computed(() => {
  const m = model.value
  if (m != null && m !== '') return m
  return props.label
})

watch(
  [model, () => props.label],
  () => {
    draft.value = displayText.value
  },
  { immediate: true }
)

const glyphMaskStyle = computed(() => {
  const u = `url("${xSmallUrl}")`
  return {
    WebkitMaskImage: u,
    maskImage: u,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain'
  } as Record<string, string>
})

function onRemoveClick () {
  emit('remove')
}

function onInputBlur () {
  const t = draft.value.trim()
  model.value = t
}

function onInputEnter (e: KeyboardEvent) {
  const el = e.target
  if (el instanceof HTMLInputElement) el.blur()
}
</script>

<template>
  <div
    class="condition-value"
    :class="{ 'condition-value--bare': variant === 'bare' }"
  >
    <div class="condition-value__label-wrap">
      <input
        v-if="editable"
        v-model="draft"
        type="text"
        class="condition-value__input"
        :aria-label="`Edit value: ${displayText}`"
        @keydown.enter.prevent="onInputEnter"
        @blur="onInputBlur"
      >
      <span v-else class="condition-value__label">{{ displayText }}</span>
    </div>
    <button
      type="button"
      class="condition-value__remove"
      :class="{ 'condition-value__remove--delete': isXHovered }"
      aria-label="Remove value"
      @mouseenter="isXHovered = true"
      @mouseleave="isXHovered = false"
      @click="onRemoveClick"
    >
      <span
        class="condition-value__glyph"
        aria-hidden="true"
        :style="glyphMaskStyle"
      />
    </button>
  </div>
</template>

<style scoped>
.condition-value {
  box-sizing: border-box;
  display: inline-flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px;
  width: max-content;
  max-width: 100%;
  padding: 3px 6px;
  border-radius: 4px;
  background-color: var(--color-background-tertiary);
  overflow: hidden;
  font-family: var(--font-family-base);
}

.condition-value__label-wrap {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 8px;
  border-right: 1px solid var(--color-border-strong);
  min-width: 0;
  flex: 0 1 auto;
}

.condition-value__label {
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.condition-value__input {
  box-sizing: border-box;
  width: auto;
  min-width: 48px;
  max-width: 200px;
  field-sizing: content;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-secondary);
}

.condition-value__input:focus {
  outline: none;
}

.condition-value__remove {
  box-sizing: border-box;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 2px;
  background-color: transparent;
  cursor: pointer;
}

.condition-value__remove:focus {
  outline: none;
}

.condition-value__remove:focus-visible {
  border-radius: 4px;
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

.condition-value__remove--delete {
  border-radius: 4px;
  background-color: var(--color-border-strong);
}

.condition-value__glyph {
  display: block;
  width: 6px;
  height: 6px;
  background-color: var(--color-text-secondary);
}

.condition-value--bare {
  background-color: transparent;
}
</style>
