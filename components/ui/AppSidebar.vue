<script setup lang="ts">
/**
 * App sidebar — Figma UI Kit (node 183:2548)
 * Nav: Ask, Jobs, Pages, Analytics; tokens from styles/tokens.css only.
 */
import { RouterLink, useRouter } from 'vue-router'
import logoUrl from '@/icons/Logo.svg?url'
import searchSidebarUrl from '@/icons/search_sidebar.svg?url'
import jobsSidebarUrl from '@/icons/jobs_sidebar.svg?url'
import pagesSidebarUrl from '@/icons/pages_sidebar.svg?url'
import analyticsSidebarUrl from '@/icons/analytics_sidebar.svg?url'

const router = useRouter()

type NavKey = 'ask' | 'jobs' | 'pages' | 'analytics'

const items: {
  key: NavKey
  label: string
  iconUrl: string
  routeName?: string
  isAsk?: boolean
}[] = [
  { key: 'ask', label: 'Ask', iconUrl: searchSidebarUrl, isAsk: true },
  { key: 'jobs', label: 'Jobs', iconUrl: jobsSidebarUrl, routeName: 'JobList' },
  { key: 'pages', label: 'Pages', iconUrl: pagesSidebarUrl, routeName: 'PageManager' },
  { key: 'analytics', label: 'Analytics', iconUrl: analyticsSidebarUrl, routeName: 'Analytics' }
]

function openAskInNewTab () {
  const href = router.resolve({ name: 'Ask' }).href
  const win = window.open(href, '_blank')
  if (win) win.opener = null
}
</script>

<template>
  <aside class="app-sidebar" aria-label="Main navigation">
    <div class="app-sidebar__logo-row">
      <img
        class="app-sidebar__logo"
        :src="logoUrl"
        alt="TotalCare"
      >
    </div>
    <nav class="app-sidebar__nav">
      <template v-for="item in items" :key="item.key">
        <button
          v-if="item.isAsk"
          type="button"
          class="app-sidebar__link app-sidebar__link--action"
          @click="openAskInNewTab"
        >
          <img
            class="app-sidebar__icon"
            :src="item.iconUrl"
            width="12"
            height="12"
            alt=""
          >
          <span class="app-sidebar__label">{{ item.label }}</span>
        </button>
        <RouterLink
          v-else
          :to="{ name: item.routeName }"
          class="app-sidebar__link"
          active-class=""
          exact-active-class=""
        >
          <img
            class="app-sidebar__icon"
            :src="item.iconUrl"
            width="12"
            height="12"
            alt=""
          >
          <span class="app-sidebar__label">{{ item.label }}</span>
        </RouterLink>
      </template>
    </nav>
  </aside>
</template>

<style scoped>
.app-sidebar {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-self: flex-start;
  gap: var(--space-6xl);
  width: fit-content;
  min-width: 0;
  height: 100vh;
  height: 100dvh;
  max-height: 100dvh;
  padding: var(--space-6xl);
  border-right: var(--border-width-hairline) solid var(--color-border-strong);
  background-color: var(--color-background-primary);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 1;
  overflow-x: hidden;
  overflow-y: auto;
}

.app-sidebar__logo-row {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--space-3xs);
  width: 100%;
}

.app-sidebar__logo {
  display: block;
  box-sizing: border-box;
  height: var(--space-xl);
  width: auto;
  max-width: 100%;
  object-fit: contain;
  object-position: left center;
}

.app-sidebar__nav {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-lg);
  width: 100%;
  min-width: 0;
}

.app-sidebar__link {
  box-sizing: border-box;
  display: inline-flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--space-2xs);
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-large-font-size);
  font-weight: var(--typography-body-large-font-weight-light);
  line-height: var(--typography-body-large-line-height-light);
  letter-spacing: var(--typography-body-large-letter-spacing-light);
  color: var(--color-text-secondary);
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
  max-width: 100%;
}

.app-sidebar__link:hover {
  color: var(--color-text-primary);
}

.app-sidebar__link:focus {
  outline: none;
}

.app-sidebar__link:focus-visible {
  border-radius: var(--radius-sm);
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

.app-sidebar__icon {
  display: block;
  flex-shrink: 0;
  width: var(--space-xl);
  height: var(--space-xl);
  object-fit: contain;
}

.app-sidebar__label {
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
</style>
