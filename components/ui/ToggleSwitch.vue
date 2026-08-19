<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    disabled?: boolean
  }>(),
  {
    modelValue: true,
    disabled: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  change: [value: boolean]
}>()

const isFocused = ref(false)

const rootClass = computed(() => ({
  'toggle-switch--active': props.modelValue,
  'toggle-switch--disabled': props.disabled,
  'toggle-switch--focused': isFocused.value,
  'toggle-switch--inactive-dim': !props.modelValue && !isFocused.value
}))

function onClick () {
  if (props.disabled) return
  const next = !props.modelValue
  emit('update:modelValue', next)
  emit('change', next)
}
</script>

<template>
  <button
    type="button"
    class="toggle-switch"
    :class="rootClass"
    :disabled="disabled"
    :aria-checked="modelValue ? 'true' : 'false'"
    role="switch"
    @click="onClick"
    @focus="isFocused = true"
    @blur="isFocused = false"
  >
    <span class="toggle-switch__track-overlay" aria-hidden="true" />
    <span class="toggle-switch__knob" aria-hidden="true" />
  </button>
</template>

<style scoped>
.toggle-switch {
  position: relative;
  display: inline-flex;
  box-sizing: border-box;
  width: 26px;
  height: 15px;
  padding: 0;
  border: none;
  border-radius: 100px;
  background-color: #b9b9bb;
  cursor: pointer;
  overflow: clip;
}

.toggle-switch__track-overlay {
  position: absolute;
  inset: 0;
  border-radius: 100px;
  pointer-events: none;
  mix-blend-mode: darken;
  background-image: linear-gradient(
    209.98deg,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.05) 100%
  );
}

.toggle-switch__knob {
  position: absolute;
  top: 50%;
  left: 1px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background-color: #ffffff;
  box-shadow:
    0 0.5px 2.5px rgba(0, 0, 0, 0.3),
    0 0 5px rgba(255, 255, 255, 0.4);
  transform: translateY(-50%);
  transition: transform 0.16s ease;
}

.toggle-switch--active {
  background-color: #2f79ff;
}

.toggle-switch--active .toggle-switch__knob {
  transform: translate(11px, -50%);
}

.toggle-switch--focused {
  box-shadow: 0 0 0 1.5px rgba(96, 154, 255, 0.4);
}

.toggle-switch--inactive-dim {
  opacity: 0.4;
}

.toggle-switch--disabled {
  cursor: default;
}

.toggle-switch:focus {
  outline: none;
}
</style>
