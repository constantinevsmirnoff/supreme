<script setup lang="ts">
/**
 * Tag input — Figma: TagInput (node 84:6312)
 * Variants: location, industry, company (icon + title). Chips reuse ConditionValue; AddButton emits add(anchor).
 */
import { computed } from 'vue'
import ConditionValue from '@/components/ui/ConditionValue.vue'
import AddButton from '@/components/ui/AddButton.vue'
import locationIconUrl from '@/icons/location.svg?url'
import industryIconUrl from '@/icons/industry.svg?url'
import companyIconUrl from '@/icons/company.svg?url'

const props = withDefaults(
  defineProps<{
    variant?: 'location' | 'industry' | 'company'
    editable?: boolean
  }>(),
  { variant: 'location', editable: false }
)

const tags = defineModel<string[]>({ default: () => [] })

const emit = defineEmits<{
  add: [anchor: HTMLElement]
}>()

const config = computed(() => {
  switch (props.variant) {
    case 'industry':
      return { title: 'Industry', icon: industryIconUrl }
    case 'company':
      return { title: 'Company', icon: companyIconUrl }
    default:
      return { title: 'Location', icon: locationIconUrl }
  }
})

const anyPlaceholder = computed(() => {
  switch (props.variant) {
    case 'industry':
      return 'Any industry'
    case 'company':
      return 'Any company'
    default:
      return 'Any location'
  }
})

const addAriaLabel = computed(() => `Add ${config.value.title.toLowerCase()}`)

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

function onAddClick (e: MouseEvent) {
  const el = e.currentTarget
  if (el instanceof HTMLElement) emit('add', el)
}
</script>

<template>
  <div class="tag-input" :class="`tag-input--${variant}`">
    <div class="tag-input__header">
      <span class="tag-input__icon-wrap" aria-hidden="true">
        <img class="tag-input__icon" :src="config.icon" alt="">
      </span>
      <span class="tag-input__title">{{ config.title }}</span>
    </div>
    <div class="tag-input__row">
      <div class="tag-input__chips">
        <span
          v-if="tags.length === 0"
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
      </div>
      <AddButton
        class="tag-input__add"
        :aria-label="addAriaLabel"
        @click="onAddClick"
      />
    </div>
  </div>
</template>

<style scoped>
.tag-input {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  max-width: 676px;
  padding: 6px;
  border: 1px solid var(--color-border-strong);
  border-radius: 5px;
  background-color: var(--color-white);
  font-family: var(--font-family-base);
}

.tag-input__header {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 2px;
  width: 100%;
}

.tag-input__icon-wrap {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.tag-input__icon {
  display: block;
  max-width: 20px;
  max-height: 20px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.tag-input__title {
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-strong);
  line-height: var(--typography-body-line-height);
  letter-spacing: 0.06px;
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
  flex: 0 1 auto;
  max-width: 100%;
  min-width: 0;
}

.tag-input__add {
  flex-shrink: 0;
}

.tag-input__placeholder {
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-tertiary);
  white-space: nowrap;
}
</style>
