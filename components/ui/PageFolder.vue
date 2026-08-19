<script setup lang="ts">
/**
 * Page Folder — Figma UI Kit (node 169:1877)
 * Frosted folder glyph from icons/folder.svg; label uses body typography tokens.
 */
import folderIconUrl from '@/icons/folder.svg?url'

withDefaults(
  defineProps<{
    title?: string
    /** Pass a short phrase when the folder is meaningful; empty = decorative */
    iconAlt?: string
    /** Multi-select / marquee — match PageCard selected (171:2023) */
    selected?: boolean
    /** Drag-over highlight */
    dropTarget?: boolean
    /** Drag source in list */
    draggingSource?: boolean
  }>(),
  {
    title: 'New Folder',
    iconAlt: '',
    selected: false,
    dropTarget: false,
    draggingSource: false
  }
)
</script>

<template>
  <article
    class="page-folder"
    :class="{
      'page-folder--selected': selected,
      'page-folder--drop-target': dropTarget,
      'page-folder--dragging-source': draggingSource
    }"
  >
    <div class="page-folder__shell">
      <div class="page-folder__icon-wrap">
        <img
          class="page-folder__icon"
          :src="folderIconUrl"
          width="76"
          height="80"
          :alt="iconAlt"
          draggable="false"
        />
      </div>
    </div>
    <p class="page-folder__title">{{ title }}</p>
  </article>
</template>

<style scoped>
.page-folder {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-sm);
  width: 100%;
  min-width: 165px;
  max-width: var(--page-folder-max-width, 200px);
  border-radius: var(--radius-xs);
  cursor: pointer;
}

.page-folder__shell {
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 199 / 131;
  padding: var(--space-lg);
  min-height: 0;
  border: var(--border-width-hairline) solid var(--color-border-light);
  border-radius: var(--radius-md);
  background-color: var(--color-background-primary);
  box-shadow: none;
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.page-folder--selected .page-folder__shell {
  border-color: var(--color-primary);
}

.page-folder--selected .page-folder__title {
  color: var(--color-primary);
}

.page-folder--drop-target .page-folder__shell {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(52, 125, 255, 0.35);
}

.page-folder--dragging-source {
  opacity: 0.3;
}

.page-folder:hover .page-folder__shell {
  box-shadow: 0 2px 8px 4px rgba(0, 0, 0, 0.05);
}

.page-folder__icon-wrap {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 76px;
  height: 80px;
  overflow: hidden;
}

.page-folder__icon {
  display: block;
  width: 76px;
  height: 80px;
  max-width: none;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

.page-folder__title {
  flex-shrink: 0;
  width: 100%;
  margin: 0;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-light);
  line-height: var(--typography-body-line-height);
  letter-spacing: var(--typography-body-letter-spacing);
  color: var(--color-text-primary);
  text-align: center;
}
</style>
