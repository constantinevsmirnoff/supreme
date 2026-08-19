<script setup lang="ts">
/**
 * Input Field — Figma: UI Kit node 141:1334
 * https://www.figma.com/design/e5qpHSeHPsA5LAF0zfjhAU/UI-Kit?node-id=141-1334
 *
 * States (text color only):
 * - placeholder visible: --color-text-tertiary
 * - typed value: --color-text-secondary
 */
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    disabled?: boolean
    id?: string
    type?: string
    autocomplete?: string
  }>(),
  {
    label: '',
    placeholder: '',
    disabled: false,
    id: '',
    type: 'text',
    autocomplete: 'off'
  }
)

const modelValue = defineModel<string>({ default: '' })

const emit = defineEmits<{
  blur: [event: FocusEvent]
}>()

const autoId = useId()
const inputId = computed(() => (props.id ? props.id : `${autoId}-input`))

function onInputBlur (event: FocusEvent) {
  emit('blur', event)
}
</script>

<template>
  <div class="input-field">
    <div v-if="label" class="input-field__label-row">
      <label :for="inputId" class="input-field__label">{{ label }}</label>
    </div>
    <div class="input-field__control">
      <input
        :id="inputId"
        v-model="modelValue"
        class="input-field__input"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
        @blur="onInputBlur"
      >
    </div>
  </div>
</template>

<style scoped>
.input-field {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-sm);
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}

.input-field__label-row {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.input-field__label {
  margin: 0;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-large-font-size);
  font-weight: var(--typography-body-large-font-weight-strong);
  line-height: var(--typography-body-large-line-height-strong);
  letter-spacing: var(--typography-body-large-letter-spacing-strong);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.input-field__control {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  height: fit-content;
  padding: 5px 10px;
  border: var(--border-width-hairline) solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background-color: var(--color-white);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.input-field__control:focus-within {
  border-color: var(--color-focus-ring);
  box-shadow: 0 0 0 2px var(--color-focus-ring);
}

.input-field__input {
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-secondary);
}

.input-field__input::placeholder {
  color: var(--color-text-tertiary);
}

.input-field__input:focus {
  outline: none;
}

.input-field__input:disabled {
  cursor: not-allowed;
  color: var(--color-text-tertiary);
}

.input-field__control:has(.input-field__input:disabled) {
  background-color: var(--color-background-secondary);
}
</style>
