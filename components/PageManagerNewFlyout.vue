<script setup lang="ts">
/**
 * “New +” flyout — Figma UI Kit New Context Menu (172:2273)
 * Opens New folder / New page chips under the trigger; outside click closes.
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Button from '@/components/ui/Button.vue'
import folderColorUrl from '@/icons/folder_color.svg?url'
import pageColorUrl from '@/icons/page_color.svg?url'

const props = withDefaults(
  defineProps<{
    label?: string
  }>(),
  { label: 'New +' }
)

const emit = defineEmits<{
  newFolder: []
  newPage: []
}>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

function toggleOpen () {
  open.value = !open.value
}

function close () {
  open.value = false
}

function onPickFolder () {
  emit('newFolder')
  close()
}

function onPickPage () {
  emit('newPage')
  close()
}

function onDocumentPointerDownCapture (e: PointerEvent) {
  if (!open.value) return
  const root = rootRef.value
  if (root && e.target instanceof Node && root.contains(e.target)) return
  close()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDownCapture, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDownCapture, true)
})
</script>

<template>
  <div
    ref="rootRef"
    class="page-manager-new-flyout"
    :class="{ 'page-manager-new-flyout--open': open }"
  >
    <Button variant="accent" @click="toggleOpen">
      {{ label }}
    </Button>
    <Transition name="pm-new-flyout">
      <div v-if="open" class="page-manager-new-flyout__panel" role="menu" aria-label="Create new">
        <button
          type="button"
          class="page-manager-new-flyout__choice"
          role="menuitem"
          @click="onPickFolder"
        >
          <span class="page-manager-new-flyout__tilt page-manager-new-flyout__tilt--folder">
            <img
              class="page-manager-new-flyout__icon"
              :src="folderColorUrl"
              width="44"
              height="38"
              alt=""
            />
            <span class="page-manager-new-flyout__label">New folder</span>
          </span>
        </button>
        <button
          type="button"
          class="page-manager-new-flyout__choice"
          role="menuitem"
          @click="onPickPage"
        >
          <span class="page-manager-new-flyout__tilt page-manager-new-flyout__tilt--page">
            <img
              class="page-manager-new-flyout__icon"
              :src="pageColorUrl"
              width="30"
              height="38"
              alt=""
            />
            <span class="page-manager-new-flyout__label">New page</span>
          </span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.page-manager-new-flyout {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: flex-start;
}

.page-manager-new-flyout--open :deep(.button.button--accent) {
  opacity: 0.3;
  border-color: rgba(52, 125, 255, 0.24);
  transition:
    opacity 0.5s cubic-bezier(0.34, 1.55, 0.32, 1),
    border-color 0.5s cubic-bezier(0.34, 1.55, 0.32, 1);
}

.page-manager-new-flyout:not(.page-manager-new-flyout--open) :deep(.button.button--accent) {
  transition:
    opacity 0.5s cubic-bezier(0.34, 1.55, 0.32, 1),
    border-color 0.5s cubic-bezier(0.34, 1.55, 0.32, 1);
}

.page-manager-new-flyout__panel {
  position: absolute;
  z-index: 60;
  left: 50%;
  top: calc(100% + 2px);
  transform: translateX(-50%);
  transform-origin: top center;
  filter: blur(0);
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: flex-end;
  gap: var(--space-lg);
  padding: var(--space-lg);
  pointer-events: auto;
}

.page-manager-new-flyout__choice {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  width: 63px;
  min-height: 58px;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font: inherit;
  color: inherit;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.12s ease-out;
}

.page-manager-new-flyout__choice:hover {
  opacity: 0.7;
}

.page-manager-new-flyout__choice:focus {
  outline: none;
}

.page-manager-new-flyout__choice:focus-visible .page-manager-new-flyout__tilt {
  border-radius: var(--radius-xs);
  box-shadow: 0 0 0 2px var(--color-focus-ring);
}

.page-manager-new-flyout__tilt {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 3px;
  width: 100%;
  min-width: 0;
}

/* Figma: folder +1.5deg, page −1.5deg (tilt inward as a pair) */
.page-manager-new-flyout__tilt--folder {
  transform: rotate(1.5deg);
}

.page-manager-new-flyout__tilt--page {
  transform: rotate(-1.5deg);
  gap: 1px;
}

.pm-new-flyout-enter-active .page-manager-new-flyout__tilt--folder,
.pm-new-flyout-enter-active .page-manager-new-flyout__tilt--page,
.pm-new-flyout-leave-active .page-manager-new-flyout__tilt--folder,
.pm-new-flyout-leave-active .page-manager-new-flyout__tilt--page {
  transition: transform 0.5s cubic-bezier(0.34, 1.55, 0.32, 1);
}

.pm-new-flyout-enter-from .page-manager-new-flyout__tilt--folder,
.pm-new-flyout-enter-from .page-manager-new-flyout__tilt--page {
  transform: rotate(0deg);
}

.pm-new-flyout-enter-to .page-manager-new-flyout__tilt--folder,
.pm-new-flyout-leave-from .page-manager-new-flyout__tilt--folder {
  transform: rotate(1.5deg);
}

.pm-new-flyout-enter-to .page-manager-new-flyout__tilt--page,
.pm-new-flyout-leave-from .page-manager-new-flyout__tilt--page {
  transform: rotate(-1.5deg);
}

.pm-new-flyout-leave-to .page-manager-new-flyout__tilt--folder,
.pm-new-flyout-leave-to .page-manager-new-flyout__tilt--page {
  transform: rotate(0deg);
}

.page-manager-new-flyout__icon {
  display: block;
  flex-shrink: 0;
  width: auto;
  height: 38px;
  max-width: 100%;
  object-fit: contain;
  pointer-events: none;
  transition: transform 0.12s ease-out;
}

.page-manager-new-flyout__choice:hover .page-manager-new-flyout__icon {
  transform: translateY(-2px);
}

.page-manager-new-flyout__label {
  display: block;
  width: 100%;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-light);
  line-height: var(--typography-body-line-height);
  letter-spacing: var(--typography-body-letter-spacing);
  color: var(--color-text-primary);
  text-align: center;
  pointer-events: none;
}

.pm-new-flyout-enter-active,
.pm-new-flyout-leave-active {
  transition:
    opacity 0.5s cubic-bezier(0.34, 1.55, 0.32, 1),
    transform 0.5s cubic-bezier(0.34, 1.55, 0.32, 1),
    filter 0.5s cubic-bezier(0.34, 1.55, 0.32, 1);
}

.pm-new-flyout-enter-from,
.pm-new-flyout-leave-to {
  opacity: 0;
  filter: blur(10px);
  transform: translate(-50%, -14px) scale(0.78);
}

.pm-new-flyout-enter-to,
.pm-new-flyout-leave-from {
  opacity: 1;
  filter: blur(0);
  transform: translate(-50%, 0) scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .pm-new-flyout-enter-active,
  .pm-new-flyout-leave-active {
    transition-duration: 0.12s;
    transition-property: opacity;
  }

  .pm-new-flyout-enter-from,
  .pm-new-flyout-leave-to {
    filter: none;
    transform: translate(-50%, 0) scale(1);
  }

  .pm-new-flyout-enter-to,
  .pm-new-flyout-leave-from {
    filter: none;
  }

  .pm-new-flyout-enter-active .page-manager-new-flyout__tilt--folder,
  .pm-new-flyout-enter-active .page-manager-new-flyout__tilt--page,
  .pm-new-flyout-leave-active .page-manager-new-flyout__tilt--folder,
  .pm-new-flyout-leave-active .page-manager-new-flyout__tilt--page {
    transition: none;
  }

  .pm-new-flyout-enter-from .page-manager-new-flyout__tilt--folder,
  .pm-new-flyout-leave-to .page-manager-new-flyout__tilt--folder {
    transform: rotate(1.5deg);
  }

  .pm-new-flyout-enter-from .page-manager-new-flyout__tilt--page,
  .pm-new-flyout-leave-to .page-manager-new-flyout__tilt--page {
    transform: rotate(-1.5deg);
  }

  .page-manager-new-flyout__icon {
    transition: none;
  }

  .page-manager-new-flyout__choice {
    transition: none;
  }
}
</style>
