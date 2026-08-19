<script setup lang="ts">
/**
 * Page Card — Figma UI Kit (165:1720); selected state 171:2023
 * `variant="folderBack"` — go-up card (177:2435) with back_arrowround.svg
 */
import backArrowRoundUrl from '@/icons/back_arrowround.svg?url'

withDefaults(
  defineProps<{
    title?: string
    thumbnailSrc?: string
    thumbnailAlt?: string
    /** Show “Live” badge with status dot */
    showLive?: boolean
    /** Show “Default” badge (primary-colored label) */
    showDefaultBadge?: boolean
    liveLabel?: string
    defaultLabel?: string
    /** Careers homepage / primary page — focus border like default job template */
    isDefault?: boolean
    /** Multi-select / marquee selection — Figma selected Page Card (171:2023) */
    selected?: boolean
    /** `folderBack` = parent navigation card inside a folder */
    variant?: 'default' | 'folderBack'
    /** Drag source “ghost” in list (30% opacity) */
    draggingSource?: boolean
    /** Drop target highlight (navigate-up / move-out target) */
    dropTarget?: boolean
  }>(),
  {
    title: 'Career Homepage English',
    thumbnailSrc: '',
    thumbnailAlt: '',
    showLive: true,
    showDefaultBadge: true,
    liveLabel: 'Live',
    defaultLabel: 'Default',
    isDefault: false,
    selected: false,
    variant: 'default',
    draggingSource: false,
    dropTarget: false
  }
)
</script>

<template>
  <article
    class="page-card"
    :class="{
      'page-card--default': isDefault,
      'page-card--selected': selected,
      'page-card--folder-back': variant === 'folderBack',
      'page-card--dragging-source': draggingSource,
      'page-card--drop-target': dropTarget
    }"
  >
    <div class="page-card__thumbnail-shell">
      <div class="page-card__thumbnail">
        <img
          v-if="variant === 'folderBack'"
          class="page-card__back-icon"
          :src="backArrowRoundUrl"
          width="48"
          height="48"
          alt=""
        />
        <img
          v-else-if="thumbnailSrc"
          class="page-card__image"
          :src="thumbnailSrc"
          :alt="thumbnailAlt"
        />
        <div v-else class="page-card__placeholder" aria-hidden="true" />
        <div v-if="variant !== 'folderBack'" class="page-card__badges">
          <div v-if="showLive" class="page-card__badge">
            <span class="page-card__dot" aria-hidden="true" />
            <span class="page-card__badge-text">{{ liveLabel }}</span>
          </div>
          <div v-if="showDefaultBadge" class="page-card__badge">
            <span class="page-card__badge-text page-card__badge-text--primary">{{ defaultLabel }}</span>
          </div>
        </div>
      </div>
    </div>
    <p class="page-card__title">{{ title }}</p>
  </article>
</template>

<style scoped>
.page-card {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-sm);
  width: 100%;
  min-width: 165px;
  max-width: var(--page-card-max-width, 200px);
  border-radius: var(--radius-xs);
  cursor: pointer;
}

/* Wrapper keeps hover shadow visible (inner thumbnail uses overflow: hidden). */
.page-card__thumbnail-shell {
  box-sizing: border-box;
  width: 100%;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  box-shadow: none;
  transition: box-shadow 0.2s ease;
}

.page-card:hover .page-card__thumbnail-shell {
  box-shadow: 0 2px 8px 4px rgba(0, 0, 0, 0.05);
}

.page-card__thumbnail {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
  aspect-ratio: 199 / 131;
  padding: var(--space-lg);
  overflow: hidden;
  border: var(--border-width-hairline) solid var(--color-border-light);
  border-radius: var(--radius-md);
  transition: border-color 0.2s ease;
}

.page-card--default .page-card__thumbnail {
  border-color: var(--color-focus-ring);
}

/* Selected — Figma UI Kit Page Card (171:2023): primary thumbnail border + title */
.page-card--selected .page-card__thumbnail {
  border-color: var(--color-primary);
}

.page-card--selected .page-card__title {
  line-height: 15px;
  color: var(--color-primary);
}

.page-card--selected:hover .page-card__title {
  opacity: 1;
  color: var(--color-primary);
}

.page-card__image {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  border-radius: var(--radius-md);
  object-fit: cover;
  pointer-events: none;
}

.page-card__placeholder {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: var(--radius-md);
  background-color: var(--color-background-tertiary);
}

.page-card--folder-back .page-card__thumbnail {
  align-items: center;
  justify-content: center;
}

.page-card__back-icon {
  position: relative;
  z-index: 0;
  display: block;
  width: 48px;
  height: 48px;
  object-fit: contain;
  pointer-events: none;
}

.page-card--dragging-source {
  opacity: 0.3;
}

.page-card--drop-target .page-card__thumbnail {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(52, 125, 255, 0.35);
}

.page-card__badges {
  position: relative;
  z-index: 1;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-xs);
}

.page-card__badge {
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-xs);
  height: 20px;
  padding: 0 var(--space-xs);
  border-radius: var(--radius-md);
  background-color: var(--color-surface-frosted);
  box-shadow: var(--shadow-tab-slider-thumb);
  -webkit-backdrop-filter: blur(var(--blur-backdrop-sm));
  backdrop-filter: blur(var(--blur-backdrop-sm));
}

.page-card__dot {
  flex-shrink: 0;
  width: var(--size-icon-sm);
  height: var(--size-icon-sm);
  border-radius: 50%;
  background-color: var(--color-success);
}

.page-card__badge-text {
  font-family: var(--font-family-base);
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-light);
  line-height: 1;
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.page-card__badge-text--primary {
  color: var(--color-primary);
}

.page-card__title {
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-light);
  line-height: var(--typography-body-line-height);
  letter-spacing: var(--typography-body-letter-spacing);
  color: var(--color-text-primary);
  text-align: center;
  opacity: 1;
  transition: opacity 0.2s ease;
}

.page-card:hover .page-card__title {
  opacity: 0.5;
}
</style>
