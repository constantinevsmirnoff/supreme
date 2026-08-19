<script setup lang="ts">
/**
 * Tag input — Figma: TagInput (84:6312)
 * Variants: location, industry, company — `add` emits pointer position for a context menu at the cursor.
 * Title variant: Add + box/header click start compose (Add hidden while typing); Enter/blur commits.
 */
import { computed, ref, watch, nextTick } from 'vue'
import ConditionValue from '@/components/ui/ConditionValue.vue'
import AddButton from '@/components/ui/AddButton.vue'

const TITLE_COMPOSE_PLACEHOLDER =
  'Type the title or part of the title to use as a condition'

const props = withDefaults(
  defineProps<{
    variant?: 'location' | 'industry' | 'company' | 'title'
    editable?: boolean
  }>(),
  { variant: 'location', editable: false }
)

const tags = defineModel<string[]>({ default: () => [] })

export type TagInputAddPayload = { clientX: number; clientY: number }

const emit = defineEmits<{
  add: [payload: TagInputAddPayload]
}>()

const config = computed(() => {
  switch (props.variant) {
    case 'industry':
      return { title: 'Industry' }
    case 'company':
      return { title: 'Company' }
    case 'title':
      return { title: 'Title' }
    default:
      return { title: 'Location' }
  }
})

const anyPlaceholder = computed(() => {
  switch (props.variant) {
    case 'industry':
      return 'Any industry'
    case 'company':
      return 'Any company'
    case 'title':
      return 'Any job title'
    default:
      return 'Any location'
  }
})

const addAriaLabel = computed(() => `Add ${config.value.title.toLowerCase()}`)

const titleComposing = ref(false)
const titleDraft = ref('')
const titleInputRef = ref<HTMLTextAreaElement | null>(null)

watch(titleComposing, (on) => {
  if (!on || props.variant !== 'title') return
  nextTick(() => {
    titleInputRef.value?.focus()
  })
})

function removeAt (index: number) {
  const next = tags.value.slice()
  next.splice(index, 1)
  tags.value = next
}

function updateTag (index: number, value: string) {
  const next = tags.value.slice()
  next[index] = value
  tags.value = next
}

function commitTitleCompose () {
  if (props.variant !== 'title') return
  const t = titleDraft.value.replace(/\s+/g, ' ').trim()
  if (t !== '') {
    tags.value = [...tags.value, t]
  }
  titleDraft.value = ''
  titleComposing.value = false
}

function onTitleInputKeydown (e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    commitTitleCompose()
  }
}

function onTitleInputBlur (e: FocusEvent) {
  if (props.variant !== 'title') return
  const related = e.relatedTarget as Node | null
  const root = (e.currentTarget as HTMLElement).closest('.tag-input')
  if (related && root?.contains(related)) return
  commitTitleCompose()
}

const tagInputHovered = ref(false)
const boxRef = ref<HTMLElement | null>(null)
const addButtonRef = ref<{ $el?: HTMLElement } | null>(null)

/** Menu anchor at pointer; keyboard-activated Add often reports 0,0 — use button/box rect. */
function pointForMenu (e: MouseEvent): TagInputAddPayload {
  if (e.clientX !== 0 || e.clientY !== 0) {
    return { clientX: e.clientX, clientY: e.clientY }
  }
  const inst = addButtonRef.value
  const btn =
    inst && inst.$el instanceof HTMLElement ? inst.$el : boxRef.value
  if (btn) {
    const r = btn.getBoundingClientRect()
    return { clientX: r.left + r.width / 2, clientY: r.bottom }
  }
  return { clientX: e.clientX, clientY: e.clientY }
}

function onAddClick (e: MouseEvent) {
  e.stopPropagation()
  if (props.variant === 'title') {
    titleComposing.value = true
    return
  }
  emit('add', pointForMenu(e))
}

/** Title: click header or box (not chips / compose / add) starts or refocuses typing. */
function onTitleTagClick (e: MouseEvent) {
  if (props.variant !== 'title') return
  const t = e.target as HTMLElement
  if (t.closest('.tag-input__add')) return
  if (t.closest('.condition-value')) return
  if (t.closest('.tag-input__compose-wrap')) return
  if (!titleComposing.value) {
    titleComposing.value = true
    return
  }
  void nextTick(() => titleInputRef.value?.focus())
}

function onBoxPointerDown (e: MouseEvent) {
  if (props.variant === 'title') return
  const t = e.target as HTMLElement
  if (t.closest('.tag-input__add')) return
  if (t.closest('.condition-value')) return
  if (t.closest('.tag-input__compose-wrap')) return
  emit('add', { clientX: e.clientX, clientY: e.clientY })
}

const showAddButton = computed(
  () => props.variant !== 'title' || !titleComposing.value
)

const showEmptyPlaceholder = computed(
  () =>
    tags.value.length === 0 &&
    !(props.variant === 'title' && titleComposing.value)
)
</script>

<template>
  <div
    class="tag-input"
    :class="[
      `tag-input--${variant}`,
      {
        'tag-input--title-composing':
          variant === 'title' && titleComposing
      }
    ]"
    @click="onTitleTagClick"
    @mouseenter="tagInputHovered = true"
    @mouseleave="tagInputHovered = false"
  >
    <div class="tag-input__header">
      <span class="tag-input__title">{{ config.title }}</span>
    </div>
    <div
      ref="boxRef"
      class="tag-input__box"
      @pointerdown="onBoxPointerDown"
    >
      <div class="tag-input__row">
        <div class="tag-input__chips">
          <span
            v-if="showEmptyPlaceholder"
            class="tag-input__placeholder"
          >{{ anyPlaceholder }}</span>
          <ConditionValue
            v-for="(tag, idx) in tags"
            :key="`${idx}-${tag}`"
            :model-value="tag"
            :label="tag"
            :editable="editable"
            @update:model-value="updateTag(idx, $event)"
            @remove="removeAt(idx)"
          />
          <div
            v-if="variant === 'title' && titleComposing"
            class="tag-input__compose-wrap"
          >
            <textarea
              ref="titleInputRef"
              v-model="titleDraft"
              class="tag-input__compose"
              rows="1"
              :placeholder="tags.length === 0 ? TITLE_COMPOSE_PLACEHOLDER : ''"
              :aria-label="TITLE_COMPOSE_PLACEHOLDER"
              spellcheck="true"
              @keydown="onTitleInputKeydown"
              @blur="onTitleInputBlur"
            />
          </div>
        </div>
        <AddButton
          v-if="showAddButton"
          ref="addButtonRef"
          class="tag-input__add"
          :aria-label="addAriaLabel"
          :parent-hover="tagInputHovered"
          @click="onAddClick"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tag-input {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
  max-width: 676px;
  font-family: var(--font-family-base);
}

.tag-input__box {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  min-height: 0;
  padding: 5px 10px;
  border: 1px solid var(--color-border-strong);
  border-radius: 5px;
  background-color: var(--color-white);
  transition: border-color 0.22s ease;
}

.tag-input__box:hover {
  cursor: pointer;
  border-color: rgba(0, 0, 0, 0.3);
}

.tag-input--title .tag-input__header {
  flex-shrink: 0;
  cursor: pointer;
}

.tag-input__header {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  width: 100%;
}

.tag-input__title {
  font-size: var(--typography-body-large-font-size);
  font-weight: var(--typography-body-large-font-weight-strong);
  line-height: var(--typography-body-large-line-height-strong);
  letter-spacing: var(--typography-body-large-letter-spacing-strong);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.tag-input__row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.tag-input__chips {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  flex: 1 1 auto;
  max-width: 100%;
  min-width: 0;
  height: fit-content;
  vertical-align: middle;
}

.tag-input--title-composing .tag-input__chips {
  align-items: stretch;
  flex: 1 1 auto;
  min-width: 0;
  width: 100%;
  max-width: 100%;
}

.tag-input__compose-wrap {
  flex: 1 1 100%;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}

.tag-input--title .tag-input__compose-wrap {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.tag-input__add {
  flex-shrink: 0;
  margin-left: auto;
}

.tag-input__placeholder {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  height: 26px;
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.tag-input__compose {
  box-sizing: border-box;
  display: block;
  width: 100%;
  margin: 0;
  padding: 4px 0;
  border: none;
  border-radius: 4px;
  background-color: transparent;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-secondary);
  overflow-wrap: anywhere;
  word-break: break-word;
  resize: none;
  overflow-x: hidden;
  overflow-y: auto;
}

.tag-input__compose::placeholder {
  color: var(--color-text-tertiary);
  white-space: normal;
}

.tag-input__compose:focus,
.tag-input__compose:focus-visible {
  outline: none;
  box-shadow: none;
}
</style>
