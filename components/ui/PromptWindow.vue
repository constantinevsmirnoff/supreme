<script setup lang="ts">
/**
 * Prompt window — Figma: Prompt window (node 186:2589)
 * https://www.figma.com/design/e5qpHSeHPsA5LAF0zfjhAU/UI-Kit?node-id=186-2589
 * Frosted panel, optional chat transcript, placeholder field, submit.
 */
import { computed, useId } from 'vue'

export type PromptChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const inputId = useId()

const props = withDefaults(
  defineProps<{
    /** Bound prompt text */
    modelValue?: string
    placeholder?: string
    disabled?: boolean
    /** Minimum visible rows for the text area */
    rows?: number
    /** Focus the field when the component mounts (e.g. toolbar AI flow) */
    focusOnMount?: boolean
    /** Chat turns shown above the composer (user + assistant) */
    messages?: PromptChatMessage[]
    /** While the assistant request is in flight */
    loading?: boolean
    /** Error text from the last failed send */
    error?: string
  }>(),
  {
    modelValue: '',
    placeholder: 'Tell me how you want your image to look like',
    disabled: false,
    rows: 2,
    focusOnMount: false,
    messages: () => [],
    loading: false,
    error: ''
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
}>()

const value = computed({
  get: () => props.modelValue,
  set: (v: string) => emit('update:modelValue', v)
})

const transcriptOpen = computed(
  () =>
    props.messages.length > 0 ||
    props.loading ||
    (props.error != null && props.error !== '')
)

function onSubmit () {
  if (props.disabled) return
  emit('submit')
}

function onPromptKeydown (e: KeyboardEvent) {
  if (e.key !== 'Enter' || e.shiftKey) return
  if (e.isComposing) return
  e.preventDefault()
  onSubmit()
}
</script>

<template>
  <div
    class="prompt-window"
    :class="{ 'prompt-window--transcript-open': transcriptOpen }"
    data-name="Prompt window"
    data-node-id="186:2589"
  >
    <div
      class="prompt-window__transcript-shell"
      :class="{ 'prompt-window__transcript-shell--open': transcriptOpen }"
      aria-live="polite"
    >
      <div class="prompt-window__transcript-scroll">
        <div
          v-for="(m, i) in messages"
          :key="i"
          class="prompt-window__bubble"
          :class="
            m.role === 'user'
              ? 'prompt-window__bubble--user'
              : 'prompt-window__bubble--assistant'
          "
          :data-node-id="m.role === 'user' ? '186:2591-user' : '186:2591-assistant'"
        >
          {{ m.content }}
        </div>
        <p v-if="loading" class="prompt-window__loading">Thinking…</p>
        <p v-if="error" class="prompt-window__error" role="alert">
          {{ error }}
        </p>
      </div>
    </div>

    <div class="prompt-window__field-row" data-node-id="186:2590">
      <textarea
        :id="inputId"
        v-model="value"
        class="prompt-window__input"
        :placeholder="placeholder"
        :disabled="disabled"
        :rows="rows"
        :autofocus="focusOnMount"
        data-node-id="186:2591"
        aria-label="Prompt"
        @keydown="onPromptKeydown"
      />
    </div>
    <div class="prompt-window__footer" data-node-id="186:2592">
      <button
        type="button"
        class="prompt-window__submit"
        aria-label="Submit prompt"
        data-node-id="186:2595"
        :disabled="disabled"
        @click="onSubmit"
      >
        <svg
          class="prompt-window__submit-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M12 19V5M12 5L6 11M12 5L18 11"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.prompt-window {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  width: 100%;
  min-height: calc(var(--space-12xl) + var(--space-5xl));
  padding: var(--space-2xl);
  border: var(--border-width-hairline) solid var(--color-border-strong);
  border-radius: var(--space-4xl);
  background-color: var(--color-surface-frosted);
  -webkit-backdrop-filter: blur(var(--blur-backdrop-sm));
  backdrop-filter: blur(var(--blur-backdrop-sm));
  box-shadow: 0 7px 8px 0 rgba(0, 0, 0, 0.25);
  font-family: var(--font-family-base);
  transition: min-height 0.35s ease;
}

.prompt-window--transcript-open {
  min-height: calc(var(--space-12xl) + var(--space-5xl) + var(--space-4xl));
}

.prompt-window__transcript-shell {
  box-sizing: border-box;
  max-height: 0;
  margin-bottom: 0;
  overflow: hidden;
  opacity: 0;
  transition:
    max-height 0.38s cubic-bezier(0.25, 0.1, 0.25, 1),
    opacity 0.28s ease,
    margin-bottom 0.28s ease;
}

.prompt-window__transcript-shell--open {
  max-height: min(55vh, 420px);
  margin-bottom: var(--space-xl);
  opacity: 1;
}

.prompt-window__transcript-scroll {
  box-sizing: border-box;
  max-height: min(55vh, 420px);
  padding-right: var(--space-xs);
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.prompt-window__bubble {
  box-sizing: border-box;
  max-width: 100%;
  margin-bottom: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-xl);
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-light);
  line-height: var(--typography-body-line-height);
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.prompt-window__bubble--user {
  margin-left: var(--space-3xl);
  border: var(--border-width-hairline) solid var(--color-border-strong);
  background-color: var(--color-white);
}

.prompt-window__bubble--assistant {
  margin-right: var(--space-xl);
  border: var(--border-width-hairline) solid var(--color-border-strong);
  background-color: color-mix(
    in srgb,
    var(--color-background-accent) 22%,
    var(--color-white)
  );
}

.prompt-window__loading {
  margin: 0 0 var(--space-md);
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-light);
  color: var(--color-text-secondary);
}

.prompt-window__error {
  margin: 0 0 var(--space-md);
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-light);
  color: var(--color-alert-muted);
}

.prompt-window__field-row {
  display: flex;
  align-items: flex-start;
  align-self: stretch;
  flex: 1 1 auto;
  min-height: 0;
  padding-left: var(--space-sm);
}

.prompt-window__input {
  box-sizing: border-box;
  display: block;
  width: 100%;
  min-height: var(--typography-body-large-line-height-light);
  margin: 0;
  padding: 0;
  border: none;
  resize: none;
  background: transparent;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-large-font-size);
  font-weight: var(--typography-body-large-font-weight-light);
  line-height: var(--typography-body-large-line-height-light);
  letter-spacing: var(--typography-body-large-letter-spacing-light);
  color: var(--color-text-primary);
  outline: none;
}

.prompt-window__input::placeholder {
  color: var(--color-text-tertiary);
  opacity: 1;
}

.prompt-window__input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.prompt-window__footer {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
  align-self: stretch;
  flex-shrink: 0;
  min-height: var(--space-10xl);
}

.prompt-window__submit {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--space-10xl);
  height: var(--space-10xl);
  margin: 0;
  padding: 0;
  border: var(--border-width-hairline) solid var(--color-border-strong);
  border-radius: 50%;
  background-color: var(--color-white);
  box-shadow: var(--shadow-tab-slider-thumb);
  color: var(--color-text-secondary);
  cursor: pointer;
  -webkit-backdrop-filter: blur(var(--blur-backdrop-sm));
  backdrop-filter: blur(var(--blur-backdrop-sm));
}

.prompt-window__submit:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.prompt-window__submit:focus {
  outline: none;
}

.prompt-window__submit:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.prompt-window__submit-icon {
  display: block;
  flex-shrink: 0;
}
</style>
