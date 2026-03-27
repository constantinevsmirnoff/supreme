<script setup lang="ts">
/**
 * Search Field — Figma: UI Kit node 37:5904
 * https://www.figma.com/design/e5qpHSeHPsA5LAF0zfjhAU/UI-Kit?node-id=37-5904
 *
 * States:
 * - default: icon + placeholder (tertiary) visible
 * - selected: icon slides left outside border; placeholder moves to left (where icon was)
 * - typed: typed text in primary color at same position; placeholder hidden
 */
import { ref, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    placeholder?: string
  }>(),
  { placeholder: 'Search…' }
)

const modelValue = defineModel<string>({ default: '' })

const isFocused = ref(false)

const state = computed(() => {
  if (modelValue.value.length > 0) return 'typed'
  if (isFocused.value) return 'selected'
  return 'default'
})
</script>

<template>
  <div
    class="search-field"
    :class="[
      'search-field--' + state
    ]"
  >
    <div class="search-field__inner">
      <!-- Icon: slides left outside on selected/typed -->
      <div class="search-field__icon-wrap" aria-hidden="true">
        <svg class="search-field__icon" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M4.90723 0C7.61741 0 9.81445 2.19704 9.81445 4.90723C9.81445 6.03349 9.43389 7.07026 8.7959 7.89844L11.583 10.6865C11.8376 10.9412 11.8377 11.3548 11.583 11.6094C11.3283 11.8637 10.9156 11.863 10.6611 11.6084L7.87109 8.81738C7.04752 9.44262 6.021 9.81445 4.90723 9.81445C2.19704 9.81445 0 7.61741 0 4.90723C0 2.19704 2.19704 0 4.90723 0ZM4.90723 1.5C3.02547 1.5 1.5 3.02547 1.5 4.90723C1.5 6.78899 3.02547 8.31445 4.90723 8.31445C6.78899 8.31445 8.31445 6.78899 8.31445 4.90723C8.31445 3.02547 6.78899 1.5 4.90723 1.5Z" fill="currentColor"/>
        </svg>
      </div>
      <!-- Placeholder: at left (where icon was) when selected; hidden when typed -->
      <span
        v-show="state !== 'typed'"
        class="search-field__placeholder"
      >{{ placeholder }}</span>
      <!-- Input: text in primary color; overlays placeholder area -->
      <input
        v-model="modelValue"
        type="text"
        class="search-field__input"
        aria-label="Search"
        @focus="isFocused = true"
        @blur="isFocused = false"
      >
    </div>
  </div>
</template>

<style scoped>
.search-field {
  overflow: hidden;
  display: inline-flex;
  min-width: 200px;
  width: 100%;
  max-width: 350px;
  height: 36px;
  border: 1px solid var(--color-border-strong);
  border-radius: 5px;
  background-color: var(--color-background-primary);
}

.search-field--selected,
.search-field--typed {
  border-color: var(--color-focus-ring);
}

/* Typed + blurred: keep tight ring without replaying focus animation */
.search-field--typed:not(:focus-within) {
  box-shadow: 0 0 0 2px var(--color-focus-ring);
}

/* Focus: soft glow → sharp ring in 600ms */
.search-field--selected:focus-within,
.search-field--typed:focus-within {
  animation: search-field-focus-ring 600ms ease forwards;
}

@keyframes search-field-focus-ring {
  from {
    box-shadow: 0 0 8px 0 var(--color-focus-ring);
  }

  to {
    box-shadow: 0 0 0 2px var(--color-focus-ring);
  }
}

.search-field__inner {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  padding: 7px 10px;
  background-color: var(--color-background-secondary);
}

/* Icon: in flow by default; slides left outside when selected/typed */
.search-field__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-right: 3px;
  transform: translateX(0);
  transition: transform 0.25s ease;
}

.search-field__icon {
  display: block;
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  color: var(--color-text-tertiary);
}

.search-field--selected .search-field__icon-wrap,
.search-field--typed .search-field__icon-wrap {
  transform: translateX(calc(-100% - 10px));
  margin-right: 0;
}

/* Placeholder: default = after icon; selected/typed = at left (where icon was) */
.search-field__placeholder {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-tertiary);
  white-space: nowrap;
  transition: left 0.25s ease;
}

.search-field--default .search-field__placeholder {
  left: 34px; /* 49px − 15px to the left */
}

.search-field--selected .search-field__placeholder,
.search-field--typed .search-field__placeholder {
  left: 8px; /* 10px + 5px from field left border (inner padding 7px + 8px = 15px) */
}

/* Input: same containing block and vertical centering as placeholder */
.search-field__input {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  width: auto;
  height: var(--typography-body-xl-line-height-light);
  padding: 0 10px 0 0;
  border: none;
  background: transparent;
  box-sizing: border-box;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-primary);
  transform: translateY(-50%);
  transition: padding-left 0.25s ease;
}

.search-field--default .search-field__input {
  padding-left: 34px;
}

.search-field--selected .search-field__input,
.search-field--typed .search-field__input {
  padding-left: 8px; /* align with placeholder, 5px right of previous */
}

.search-field__input::placeholder {
  color: var(--color-text-tertiary);
}

.search-field__input:focus {
  outline: none;
}
</style>
