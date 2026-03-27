<script setup lang="ts">
/**
 * Checkbox — Figma: Checkbox (node 7:4635)
 * States: Default (Inactive), Active (checked), Focus, Disabled (Variant3/Variant4)
 * Size: 14×14px, border-radius 2px
 */
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    /** Focus ring visible (optional; uses internal focus when not provided) */
    focus?: boolean
    disabled?: boolean
  }>(),
  { modelValue: false, focus: false, disabled: false }
)

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const isFocused = ref(false)
const effectiveFocus = computed(() => props.focus ?? isFocused.value)

const stateClass = computed(() => {
  if (props.disabled) return props.modelValue ? 'checkbox--disabled-checked' : 'checkbox--disabled-unchecked'
  if (effectiveFocus.value) return props.modelValue ? 'checkbox--focus-checked' : 'checkbox--focus-unchecked'
  return props.modelValue ? 'checkbox--active' : 'checkbox--default'
})

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    type="button"
    class="checkbox"
    :class="stateClass"
    role="checkbox"
    :aria-checked="modelValue"
    :aria-disabled="disabled"
    :disabled="disabled"
    @click="toggle"
    @focus="isFocused = true"
    @blur="isFocused = false"
  >
    <span v-show="modelValue" class="checkbox__check" aria-hidden="true">
      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 4L4 7L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
  </button>
</template>

<style scoped>
.checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  padding: 0;
  border: 1px solid;
  border-radius: 2px;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  color: var(--color-background-primary);
}

.checkbox:focus {
  outline: none;
}

/* Default: unchecked */
.checkbox--default {
  border-color: var(--color-text-tertiary);
}

/* Active: checked */
.checkbox--active {
  border-color: var(--color-primary);
  background-color: var(--color-primary);
}

/* Focus: unchecked with focus ring */
.checkbox--focus-unchecked {
  border-color: var(--color-focus-ring);
  background: transparent;
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

/* Focus: checked with focus ring */
.checkbox--focus-checked,
.checkbox--focus-checked.checkbox--focus-checked {
  border-color: var(--color-primary);
  background-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

/* Disabled: unchecked */
.checkbox--disabled-unchecked {
  border-color: var(--color-text-tertiary);
  opacity: 0.5;
  cursor: not-allowed;
}

/* Disabled: checked */
.checkbox--disabled-checked {
  border-color: var(--color-text-tertiary);
  background-color: var(--color-text-tertiary);
  opacity: 0.7;
  cursor: not-allowed;
}

.checkbox--disabled-checked .checkbox__check {
  color: var(--color-background-primary);
}

.checkbox__check {
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
}
</style>
