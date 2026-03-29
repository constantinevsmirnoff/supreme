<script setup>
import { ref, computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { enableConvexDevelopmentDeployment } from '@/src/config/convexRuntime.js'
import ConvexWorkspaceSync from '@/components/ConvexWorkspaceSync.vue'

if (import.meta.env.DEV) {
  enableConvexDevelopmentDeployment()
}
import Status from '@/components/ui/Status.vue'
import Checkbox from '@/components/ui/Checkbox.vue'
import CloseButton from '@/components/ui/CloseButton.vue'
import DropdownSelector from '@/components/ui/DropdownSelector.vue'
import GhostButton from '@/components/ui/GhostButton.vue'
import PromoteButton from '@/components/ui/PromoteButton.vue'
import LastUpdated from '@/components/ui/LastUpdated.vue'
import ThreeDotMenu from '@/components/ui/ThreeDotMenu.vue'
import AddButton from '@/components/ui/AddButton.vue'
import AssignedJob from '@/components/ui/AssignedJob.vue'
import Button from '@/components/ui/Button.vue'
import SearchField from '@/components/ui/SearchField.vue'
import TabSwitcher from '@/components/ui/TabSwitcher.vue'
import Toolbar from '@/components/ui/Toolbar.vue'
import TagInput from '@/components/ui/TagInput.vue'
import ConditionPill from '@/components/ui/ConditionPill.vue'
import ConditionValue from '@/components/ui/ConditionValue.vue'
import ContextMenuItem from '@/components/ui/ContextMenuItem.vue'
import AlertMessage from '@/components/ui/AlertMessage.vue'
import Annotation from '@/components/ui/Annotation.vue'
import JobCard from '@/components/JobCard.vue'
import JobTemplateCard from '@/components/JobTemplateCard.vue'

const route = useRoute()
const router = useRouter()

/** Toolbar: 0 Jobs, 1 Page Manager, 2 Component Showcase — matches `/jobs`, `/page-manager`, `/` */
const toolbarNavIndex = computed({
  get () {
    switch (route.name) {
      case 'JobList':
        return 0
      case 'PageManager':
        return 1
      case 'Showcase':
        return 2
      default:
        return 0
    }
  },
  set (value) {
    if (value === 0) {
      router.push({ name: 'JobList' })
    } else if (value === 1) {
      router.push({ name: 'PageManager' })
    } else if (value === 2) {
      router.push({ name: 'Showcase' })
    }
  }
})

const hasFloatingToolbar = computed(() =>
  route.name === 'JobList' || route.name === 'PageManager' || route.name === 'Showcase'
)

const searchQuery = ref('')

const showcaseJob = {
  id: 'showcase-job-1',
  jobTitle: 'Senior Product Designer (m/w/d)',
  location: 'Berlin, Hamburg',
  industry: 'Technology',
  company: 'Olsen & Breuner GmbH',
  jobTemplate: 'Standard job page',
  active: true,
  lastUpdated: '15/03/2026'
}

const showcaseAssignedJob = {
  jobTitle: 'Product Manager (m/w/d)',
  location: 'Berlin, Munich, Leipzig, Hamburg +12',
  industry: 'Product Management',
  company: 'Innovatech Solutions'
}

/** Every `.vue` under `components/` (for the index on the Showcase page) */
const componentLibraryPaths = [
  'components/JobCard.vue',
  'components/JobTemplateCard.vue',
  'components/JobTemplateOverlay.vue',
  'components/PageManager.vue',
  'components/ui/AddButton.vue',
  'components/ui/AssignedJob.vue',
  'components/ui/Button.vue',
  'components/ui/Checkbox.vue',
  'components/ui/CloseButton.vue',
  'components/ui/ConditionPill.vue',
  'components/ui/ConditionValue.vue',
  'components/ui/ContextMenuItem.vue',
  'components/ui/DropdownSelector.vue',
  'components/ui/GhostButton.vue',
  'components/ui/AlertMessage.vue',
  'components/ui/Annotation.vue',
  'components/ui/LastUpdated.vue',
  'components/ui/PromoteButton.vue',
  'components/ui/SearchField.vue',
  'components/ui/Status.vue',
  'components/ui/TabSwitcher.vue',
  'components/ui/TagInput.vue',
  'components/ui/ThreeDotMenu.vue',
  'components/ui/Toolbar.vue'
]

const checkbox1 = ref(false)
const checkbox2 = ref(true)
const checkbox3 = ref(false)
const checkboxDisabledUnchecked = ref(false)
const checkboxDisabledChecked = ref(true)

const tabSwitcherShowcase = ref(0)
const tabSwitcherShowcaseLabels = ref(1)

const toolbarShowcase = ref(0)

const tagInputLocationTags = ref(['Value 1', 'Value 2'])
const tagInputIndustryTags = ref(['Finance', 'Technology'])
const tagInputCompanyTags = ref(['Olsen & Breuner GmbH'])

const alertMessageShowcaseVisible = ref(true)

const showcaseLockedDropdownLabel = ref('Auto-assigned template')
const showcaseLockedDropdownLocked = ref(true)

function onShowcaseLockedDropdownSelect (value) {
  showcaseLockedDropdownLabel.value = value
  showcaseLockedDropdownLocked.value = false
}

function addTagInputLocation () {
  tagInputLocationTags.value = [
    ...tagInputLocationTags.value,
    `Value ${tagInputLocationTags.value.length + 1}`
  ]
}
function addTagInputIndustry () {
  tagInputIndustryTags.value = [
    ...tagInputIndustryTags.value,
    `Industry ${tagInputIndustryTags.value.length + 1}`
  ]
}
function addTagInputCompany () {
  tagInputCompanyTags.value = [
    ...tagInputCompanyTags.value,
    `Company ${tagInputCompanyTags.value.length + 1}`
  ]
}

</script>

<template>
  <div class="app" :class="{ 'app--floating-toolbar': hasFloatingToolbar }">
    <div v-if="route.name === 'Showcase'" class="showcase page">
      <header class="page__header">
        <h1 class="page__title">UI Kit — Component Showcase</h1>
        <p class="page__subtitle">Visual consistency check</p>
      </header>

      <main class="page__main">
        <section class="section">
          <h2 class="section__title">Components in <code class="section__code">components/</code></h2>
          <p class="section__lead">
            All Vue modules under <code class="section__code">@/components</code> are listed below; scroll down for live previews.
          </p>
          <ul class="component-index">
            <li v-for="path in componentLibraryPaths" :key="path" class="component-index__item">
              <code class="component-index__path">{{ path }}</code>
            </li>
          </ul>
        </section>

        <section class="section">
          <h2 class="section__title">Status</h2>
          <div class="section__row">
            <div class="cell">
              <span class="cell__label">Active</span>
              <Status :active="true" />
            </div>
            <div class="cell">
              <span class="cell__label">Inactive</span>
              <Status :active="false" />
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Checkbox</h2>
          <div class="section__row section__row--wrap">
            <div class="cell">
              <span class="cell__label">Default (unchecked)</span>
              <Checkbox v-model="checkbox1" />
            </div>
            <div class="cell">
              <span class="cell__label">Active (checked)</span>
              <Checkbox v-model="checkbox2" />
            </div>
            <div class="cell">
              <span class="cell__label">Focus (tab to focus)</span>
              <Checkbox v-model="checkbox3" />
            </div>
            <div class="cell">
              <span class="cell__label">Disabled unchecked</span>
              <Checkbox v-model="checkboxDisabledUnchecked" disabled />
            </div>
            <div class="cell">
              <span class="cell__label">Disabled checked</span>
              <Checkbox v-model="checkboxDisabledChecked" disabled />
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Search Field</h2>
          <div class="section__row section__row--wrap">
            <div class="cell">
              <span class="cell__label">Default / Selected / With input</span>
              <SearchField v-model="searchQuery" placeholder="Search…" />
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Dropdown Selector</h2>
          <div class="section__row section__row--wrap">
            <div class="cell">
              <span class="cell__label">Default</span>
              <DropdownSelector label="Default" />
            </div>
            <div class="cell">
              <span class="cell__label">With label</span>
              <DropdownSelector label="Option A" />
            </div>
            <div class="cell">
              <span class="cell__label">Disabled</span>
              <DropdownSelector label="Disabled" disabled />
            </div>
            <div class="cell cell--dropdown-locked">
              <span class="cell__label">Locked — press &amp; hold 0.7s to unlock</span>
              <DropdownSelector
                :label="showcaseLockedDropdownLabel"
                :locked="showcaseLockedDropdownLocked"
                :menu-items="[
                  { label: 'Standard job page' },
                  { label: 'Tech Solutions Engineering' },
                  { label: 'Berlin Metro Pack' }
                ]"
                @select="onShowcaseLockedDropdownSelect"
              />
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Last Updated</h2>
          <div class="section__row section__row--wrap">
            <div class="cell">
              <span class="cell__label">Default</span>
              <LastUpdated date="19/12/2025" />
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Three Dot Menu</h2>
          <div class="section__row section__row--wrap">
            <div class="cell">
              <span class="cell__label">Default / Hover</span>
              <ThreeDotMenu />
            </div>
            <div class="cell">
              <span class="cell__label">Disabled</span>
              <ThreeDotMenu disabled />
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Close Button</h2>
          <p class="section__lead"><code class="section__code">components/ui/CloseButton.vue</code> — icon <code class="section__code">icons/x.svg</code>; Figma CloseButton (80:5719)</p>
          <div class="section__row section__row--wrap">
            <div class="cell">
              <span class="cell__label">Default / Hover</span>
              <CloseButton />
            </div>
            <div class="cell">
              <span class="cell__label">Custom label</span>
              <CloseButton aria-label="Dismiss panel" />
            </div>
            <div class="cell">
              <span class="cell__label">Disabled</span>
              <CloseButton disabled />
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Context Menu Item</h2>
          <p class="section__lead">
            <code class="section__code">components/ui/ContextMenuItem.vue</code> — Figma ContextMenuItem (86:6592). Demo panel matches Figma Tag Input / Filter Options — Location (86:6626): frosted surface, 3px row gap, 5px inset, 6px radius, drop shadow.
          </p>
          <div class="section__row section__row--wrap">
            <div class="cell cell--context-menu">
              <span class="cell__label">Menu (250px)</span>
              <div class="context-menu-demo context-menu" role="menu" aria-label="Demo context menu">
                <ContextMenuItem label="Item" />
                <ContextMenuItem label="Edit" />
                <ContextMenuItem label="Remove" disabled />
              </div>
            </div>
            <div class="cell cell--context-menu">
              <span class="cell__label">Slot content</span>
              <div class="context-menu-demo context-menu" role="menu" aria-label="Demo with slot">
                <ContextMenuItem>Custom label</ContextMenuItem>
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Toolbar</h2>
          <p class="section__lead">
            <code class="section__code">components/ui/Toolbar.vue</code> — Figma Toolbar (<a class="app__link" href="https://www.figma.com/design/e5qpHSeHPsA5LAF0zfjhAU/UI-Kit?node-id=134-871" target="_blank" rel="noopener noreferrer">134:871</a>); icons <code class="section__code">icons/jobs.svg</code>, <code class="section__code">page_manager.svg</code>, <code class="section__code">settings.svg</code>.
          </p>
          <div class="section__row section__row--wrap">
            <div class="cell cell--toolbar">
              <span class="cell__label">Jobs / Page Manager / Showcase</span>
              <Toolbar v-model="toolbarShowcase" />
              <p class="cell__hint">Active index: {{ toolbarShowcase }} (0 = Jobs, 1 = Page Manager, 2 = Component Showcase)</p>
            </div>
            <div class="cell cell--toolbar">
              <span class="cell__label">Disabled</span>
              <Toolbar :model-value="1" disabled />
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Tab Switcher</h2>
          <p class="section__lead"><code class="section__code">components/ui/TabSwitcher.vue</code> — Figma TabSwitcher (82:5943)</p>
          <div class="section__row section__row--wrap">
            <div class="cell cell--tab-switcher">
              <span class="cell__label">Default labels</span>
              <TabSwitcher v-model="tabSwitcherShowcase" />
              <p class="cell__hint">Active index: {{ tabSwitcherShowcase }}</p>
            </div>
            <div class="cell cell--tab-switcher">
              <span class="cell__label">Custom labels</span>
              <TabSwitcher
                v-model="tabSwitcherShowcaseLabels"
                option-1-label="Pages"
                option-2-label="Templates"
              />
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Add Button</h2>
          <p class="section__lead"><code class="section__code">components/ui/AddButton.vue</code> — icon <code class="section__code">icons/plus.svg</code>; Figma AddButton (85:6447)</p>
          <div class="section__row section__row--wrap">
            <div class="cell">
              <span class="cell__label">Default / Hover</span>
              <AddButton />
            </div>
            <div class="cell">
              <span class="cell__label">Custom label</span>
              <AddButton aria-label="Add filter" />
            </div>
            <div class="cell">
              <span class="cell__label">Disabled</span>
              <AddButton disabled />
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Button</h2>
          <div class="section__row section__row--wrap">
            <div class="cell">
              <span class="cell__label">Default</span>
              <Button>Title</Button>
            </div>
            <div class="cell">
              <span class="cell__label">Accent</span>
              <Button variant="accent">Title</Button>
            </div>
            <div class="cell">
              <span class="cell__label">Half Accent</span>
              <Button variant="half-accent">Title</Button>
            </div>
            <div class="cell">
              <span class="cell__label">Danger</span>
              <Button variant="danger">Title</Button>
            </div>
            <div class="cell">
              <span class="cell__label">Disabled</span>
              <Button disabled>Title</Button>
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Ghost Button</h2>
          <p class="section__lead">
            <code class="section__code">components/ui/GhostButton.vue</code> — Figma GhostButton (95:538); default / hover (tab or point); custom label; disabled.
          </p>
          <div class="section__row section__row--wrap">
            <div class="cell">
              <span class="cell__label">Default / Hover</span>
              <GhostButton />
            </div>
            <div class="cell">
              <span class="cell__label">Custom label</span>
              <GhostButton>Reset filters</GhostButton>
            </div>
            <div class="cell">
              <span class="cell__label">Disabled</span>
              <GhostButton disabled />
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Condition Pill</h2>
          <p class="section__lead">
            <code class="section__code">values</code> join with commas; narrow width shows <code class="section__code">+N</code> for hidden entries. Single <code class="section__code">label</code> uses ellipsis when long.
          </p>
          <div class="section__row section__row--wrap">
            <div class="cell">
              <span class="cell__label">Location</span>
              <ConditionPill variant="location" />
            </div>
            <div class="cell">
              <span class="cell__label">Industry</span>
              <ConditionPill variant="industry" />
            </div>
            <div class="cell">
              <span class="cell__label">Company</span>
              <ConditionPill variant="company" />
            </div>
            <div class="cell cell--condition-pill-wide">
              <span class="cell__label">Several cities (resize / narrow column)</span>
              <ConditionPill variant="location" :values="['Berlin', 'Hamburg', 'München', 'Köln']" />
            </div>
            <div class="cell">
              <span class="cell__label">Single label</span>
              <ConditionPill variant="location" label="Berlin + 2" />
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Condition Value</h2>
          <p class="section__lead"><code class="section__code">components/ui/ConditionValue.vue</code> — Figma ConditionValue (83:6093); icon <code class="section__code">icons/x_small.svg</code>. Hover the X for delete state.</p>
          <div class="section__row section__row--wrap">
            <div class="cell">
              <span class="cell__label">Default / X hover</span>
              <ConditionValue />
            </div>
            <div class="cell">
              <span class="cell__label">Custom label</span>
              <ConditionValue label="Olsen & Breuner GmbH" />
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Tag Input</h2>
          <p class="section__lead"><code class="section__code">components/ui/TagInput.vue</code> — Figma TagInput (84:6312). Icons: <code class="section__code">icons/location.svg</code>, <code class="section__code">industry.svg</code>, <code class="section__code">company.svg</code>. <code class="section__code">AddButton</code> emits <code class="section__code">add</code> (showcase appends a sample tag).</p>
          <div class="section__row section__row--wrap">
            <div class="cell cell--tag-input">
              <span class="cell__label">Location</span>
              <TagInput v-model="tagInputLocationTags" variant="location" @add="addTagInputLocation" />
            </div>
            <div class="cell cell--tag-input">
              <span class="cell__label">Industry</span>
              <TagInput v-model="tagInputIndustryTags" variant="industry" @add="addTagInputIndustry" />
            </div>
            <div class="cell cell--tag-input">
              <span class="cell__label">Company</span>
              <TagInput v-model="tagInputCompanyTags" variant="company" @add="addTagInputCompany" />
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Promote Button</h2>
          <div class="section__row section__row--wrap">
            <div class="cell">
              <span class="cell__label">Default</span>
              <PromoteButton />
            </div>
            <div class="cell">
              <span class="cell__label">Disabled</span>
              <PromoteButton disabled />
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">JobCard</h2>
          <p class="section__lead"><code class="section__code">components/JobCard.vue</code></p>
          <div class="showcase-embed showcase-embed--card">
            <JobCard :job="showcaseJob" />
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Assigned Job</h2>
          <p class="section__lead">
            <code class="section__code">components/ui/AssignedJob.vue</code> — Figma Assigned Job (86:7077)
          </p>
          <div class="section__row section__row--wrap">
            <div class="cell cell--assigned-job">
              <span class="cell__label">Figma copy</span>
              <AssignedJob
                :job-title="showcaseAssignedJob.jobTitle"
                :location="showcaseAssignedJob.location"
                :industry="showcaseAssignedJob.industry"
                :company="showcaseAssignedJob.company"
              />
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">JobTemplateCard</h2>
          <p class="section__lead"><code class="section__code">components/JobTemplateCard.vue</code> — Figma Page Template Card (58:6093)</p>
          <div class="showcase-embed showcase-embed--job-template-card">
            <JobTemplateCard />
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Annotation</h2>
          <p class="section__lead">
            <code class="section__code">components/ui/Annotation.vue</code> — Figma UI Kit Annotation (<a class="app__link" href="https://www.figma.com/design/e5qpHSeHPsA5LAF0zfjhAU/UI-Kit?node-id=111-790" target="_blank" rel="noopener noreferrer">111:790</a>); frosted surface and body typography from <code class="section__code">tokens.css</code>.
          </p>
          <div class="section__row section__row--wrap">
            <div class="cell">
              <span class="cell__label">Default copy</span>
              <Annotation />
            </div>
            <div class="cell">
              <span class="cell__label">Custom text</span>
              <Annotation text="Drag to reorder items in this list." />
            </div>
            <div class="cell">
              <span class="cell__label">Slot</span>
              <Annotation>Custom note supplied through the default slot.</Annotation>
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">AlertMessage</h2>
          <p class="section__lead">
            <code class="section__code">components/ui/AlertMessage.vue</code> — Figma Error Message (92:998); uses <code class="section__code">--color-alert-muted</code>. Full-screen template editor lives in <code class="section__code">components/JobTemplateOverlay.vue</code> (open via <strong>Page Manager</strong>).
          </p>
          <div class="showcase-embed showcase-embed--alert-message">
            <AlertMessage
              v-if="alertMessageShowcaseVisible"
              @close="alertMessageShowcaseVisible = false"
            />
            <button
              v-else
              type="button"
              class="alert-message-showcase-reset"
              @click="alertMessageShowcaseVisible = true"
            >
              Show notice again
            </button>
          </div>
        </section>
      </main>
    </div>

    <template v-else>
      <ConvexWorkspaceSync />
      <RouterView />
    </template>

    <div v-if="hasFloatingToolbar" class="app-toolbar-wrap">
      <Toolbar v-model="toolbarNavIndex" aria-label="App sections" />
    </div>
  </div>
</template>

<style scoped>
.app {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  flex: 1 1 auto;
}

/** Space for fixed toolbar (≈40px offset + pill height + gap) */
.app--floating-toolbar {
  padding-bottom: 96px;
}

.app-toolbar-wrap {
  position: fixed;
  left: 50%;
  bottom: 40px;
  z-index: 100;
  box-sizing: border-box;
  transform: translateX(-50%);
  pointer-events: none;
}

.app-toolbar-wrap :deep(.toolbar) {
  pointer-events: auto;
}

.app__link {
  padding: 6px 12px;
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-light);
  color: var(--color-text-secondary);
  text-decoration: none;
  border-radius: 5px;
}

.app__link:hover {
  color: var(--color-primary);
}

.showcase.page {
  flex: 1 1 auto;
  min-height: 100vh;
  min-height: 100dvh;
  box-sizing: border-box;
  padding: 24px 24px 32px;
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  font-family: var(--font-family-base);
}

.page__header {
  margin-bottom: 40px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border-strong);
}

.page__title {
  margin: 0 0 8px;
  font-size: var(--typography-title-1-font-size);
  font-weight: var(--typography-title-1-font-weight-strong);
  line-height: var(--typography-title-1-line-height);
  letter-spacing: var(--typography-title-1-letter-spacing);
}

.page__subtitle {
  margin: 0;
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  color: var(--color-text-secondary);
}

.page__main {
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section__title {
  margin: 0;
  font-size: var(--typography-title-2-font-size);
  font-weight: var(--typography-title-2-font-weight-strong);
  line-height: var(--typography-title-2-line-height);
  color: var(--color-text-primary);
}

.section__row {
  display: flex;
  align-items: center;
  gap: 24px;
}

.section__row--wrap {
  flex-wrap: wrap;
  gap: 24px 32px;
}

.cell {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
}

.cell__label {
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-light);
  color: var(--color-text-secondary);
  min-width: 120px;
}

.cell--toolbar {
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.cell--toolbar .cell__label {
  min-width: 0;
  align-self: flex-start;
}

.cell--tab-switcher {
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  min-width: 280px;
}

.cell--tab-switcher .cell__label {
  min-width: 0;
  align-self: flex-start;
}

.cell--condition-pill-wide {
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  max-width: 240px;
  min-width: 0;
}

.cell--condition-pill-wide .cell__label {
  min-width: 0;
  align-self: flex-start;
}

.cell__hint {
  margin: 0;
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-light);
  color: var(--color-text-tertiary);
}

.cell--context-menu {
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  min-width: 0;
}

.cell--context-menu .cell__label {
  min-width: 0;
  align-self: flex-start;
}

.context-menu-demo {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 3px;
  width: 250px;
  max-width: 100%;
  padding: 5px;
  border: none;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.8);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  box-shadow: 0 7px 22px 0 rgba(0, 0, 0, 0.25);
}

.cell--assigned-job {
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  min-width: 0;
  max-width: 720px;
}

.cell--assigned-job .cell__label {
  min-width: 0;
  align-self: flex-start;
}

.cell--tag-input {
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  min-width: 280px;
  max-width: 720px;
}

.cell--tag-input .cell__label {
  min-width: 0;
  align-self: flex-start;
}

.cell--dropdown-locked {
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  min-height: 120px;
}

.section__lead {
  margin: 0;
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-light);
  line-height: var(--typography-body-line-height);
  color: var(--color-text-secondary);
}

.section__code {
  font-family: ui-monospace, monospace;
  font-size: 0.95em;
  padding: 0.1em 0.35em;
  border-radius: 4px;
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
}

.component-index {
  margin: 0;
  padding-left: 1.25rem;
  font-family: ui-monospace, monospace;
  font-size: var(--typography-body-font-size);
  line-height: 1.6;
  color: var(--color-text-primary);
}

.component-index__item {
  margin: 0.15em 0;
}

.component-index__path {
  font-size: inherit;
}

.showcase-embed {
  border: 1px solid var(--color-border-strong);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-background-secondary);
}

.showcase-embed--card :deep(.job-card) {
  border-bottom: none;
}

.showcase-embed--job-template-card {
  max-width: 640px;
}

.showcase-embed--alert-message {
  max-width: 720px;
  padding: 16px;
  background: var(--color-background-secondary);
}

.alert-message-showcase-reset {
  padding: 8px 14px;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-light);
  color: var(--color-primary);
  background: var(--color-white);
  border: 1px solid var(--color-border-strong);
  border-radius: 5px;
  cursor: pointer;
}

.alert-message-showcase-reset:hover {
  border-color: var(--color-primary);
}
</style>
