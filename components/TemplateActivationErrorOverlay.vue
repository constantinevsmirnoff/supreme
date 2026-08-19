<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import Button from '@/components/ui/Button.vue'

const props = withDefaults(
  defineProps<{
    title?: string
    message: string
  }>(),
  {
    title: 'Unable to activate template'
  }
)

const emit = defineEmits<{
  close: []
}>()

function onClose () {
  emit('close')
}

function onKeydown (e: KeyboardEvent) {
  if (e.key === 'Escape') onClose()
}

function onBackdropPointerDown (e: PointerEvent) {
  if (e.target === e.currentTarget) onClose()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="template-activation-error-overlay-root">
      <div
        class="template-activation-error-overlay__backdrop"
        @pointerdown="onBackdropPointerDown"
      />
      <div
        class="template-activation-error-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <h2 class="template-activation-error-overlay__title">{{ title }}</h2>
        <p class="template-activation-error-overlay__message">{{ message }}</p>
        <Button variant="accent" @click="onClose">Close</Button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.template-activation-error-overlay-root {
  position: fixed;
  inset: 0;
  z-index: 10040;
}

.template-activation-error-overlay__backdrop {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.35);
}

.template-activation-error-overlay {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: min(520px, calc(100vw - 48px));
  padding: 24px;
  border-radius: 20px;
  background-color: var(--color-white);
  box-shadow: 0 7px 22px 0 rgba(0, 0, 0, 0.25);
}

.template-activation-error-overlay__title {
  margin: 0;
  font-family: var(--font-family-base);
  font-size: var(--typography-title-2-font-size);
  font-weight: var(--typography-title-2-font-weight-strong);
  line-height: var(--typography-title-2-line-height);
  letter-spacing: var(--typography-title-2-letter-spacing);
  color: var(--color-text-primary);
}

.template-activation-error-overlay__message {
  margin: 0;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-tertiary);
}
</style>
