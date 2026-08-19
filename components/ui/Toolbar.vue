<script setup lang="ts">
/**
 * App toolbar — Figma: Toolbar (node 134:871)
 * Three destinations: Jobs, Page Manager, Component Showcase; sliding circular highlight (--color-background-accent).
 */
import { computed } from 'vue'
import jobsIconUrl from '@/icons/jobs.svg?url'
import pageManagerIconUrl from '@/icons/page_manager.svg?url'
import settingsIconUrl from '@/icons/settings.svg?url'
import aiBrainIconUrl from '@/icons/ai_brain.svg?url'

const props = withDefaults(
  defineProps<{
    /** 0 = Jobs, 1 = Page Manager, 2 = Component Showcase */
    modelValue?: number
    disabled?: boolean
    /** Accessible name for the toolbar */
    ariaLabel?: string
  }>(),
  {
    modelValue: 0,
    disabled: false,
    ariaLabel: 'Main navigation'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
  /** AI agent control (Figma UI-Kit node 186:2598) */
  'ai-agent': []
}>()

const items = [
  { id: 'toolbar-jobs' as const, label: 'Jobs', iconUrl: jobsIconUrl },
  { id: 'toolbar-page-manager' as const, label: 'Page Manager', iconUrl: pageManagerIconUrl },
  { id: 'toolbar-showcase' as const, label: 'Component Showcase', iconUrl: settingsIconUrl }
]

/** One `left` value per slot so `transition: left` animates for any index change (0↔2, etc.). */
const TRACK_PAD_PX = 2
const SLOT_STRIDE_PX = 42 + 4

const indicatorStyle = computed(() => {
  const i = Math.min(Math.max(props.modelValue, 0), items.length - 1)
  return { left: `${TRACK_PAD_PX + i * SLOT_STRIDE_PX}px` }
})

function maskStyle (iconUrl: string) {
  const u = `url("${iconUrl}")`
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
}

function select (index: number) {
  if (props.disabled) return
  if (index === props.modelValue) return
  emit('update:modelValue', index)
}

function onAiAgent () {
  if (props.disabled) return
  emit('ai-agent')
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar__cluster">
      <div
        class="toolbar__track"
        role="toolbar"
        :aria-label="ariaLabel"
        :aria-disabled="disabled ? 'true' : undefined"
      >
        <div
          class="toolbar__indicator"
          :style="indicatorStyle"
          aria-hidden="true"
        />
        <button
          v-for="(item, index) in items"
          :id="item.id"
          :key="item.id"
          type="button"
          class="toolbar__btn"
          :class="{ 'toolbar__btn--active': modelValue === index }"
          :aria-pressed="modelValue === index"
          :disabled="disabled"
          :aria-label="item.label"
          @click="select(index)"
        >
          <span class="toolbar__icon-wrap" aria-hidden="true">
            <span class="toolbar__icon" :style="maskStyle(item.iconUrl)" />
          </span>
        </button>
      </div>
      <button
        type="button"
        class="toolbar__ai"
        aria-label="AI agent"
        :disabled="disabled"
        @click="onAiAgent"
      >
        <span class="toolbar__icon-wrap" aria-hidden="true">
          <span class="toolbar__icon" :style="maskStyle(aiBrainIconUrl)" />
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.toolbar__cluster {
  display: flex;
  align-items: center;
  gap: var(--space-2xl);
}

.toolbar__track {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2xs);
  box-sizing: border-box;
  height: 46px;
  padding: 2px;
  border: var(--border-width-hairline) solid var(--color-border-strong);
  border-radius: 100px;
  background-color: var(--color-border-light);
  -webkit-backdrop-filter: blur(var(--blur-backdrop-sm));
  backdrop-filter: blur(var(--blur-backdrop-sm));
  overflow: clip;
}

.toolbar__indicator {
  position: absolute;
  top: 1.5px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background-color: var(--color-background-accent);
  z-index: 0;
  pointer-events: none;
  transition: left 0.22s ease;
}

.toolbar__btn {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 1000px;
  background: transparent;
  cursor: pointer;
  color: var(--color-text-secondary);
}

.toolbar__btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.toolbar__btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.toolbar__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.toolbar__icon {
  display: block;
  width: 24px;
  height: 24px;
  background-color: currentColor;
}

.toolbar__btn--active {
  color: var(--color-text-secondary);
}

.toolbar__ai {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
  width: 46px;
  height: 46px;
  margin: 0;
  padding: 0;
  border: var(--border-width-hairline) solid var(--color-border-strong);
  border-radius: 50%;
  background-color: var(--color-border-light);
  -webkit-backdrop-filter: blur(var(--blur-backdrop-sm));
  backdrop-filter: blur(var(--blur-backdrop-sm));
  cursor: pointer;
  color: var(--color-text-secondary);
}

.toolbar__ai:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.toolbar__ai:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
