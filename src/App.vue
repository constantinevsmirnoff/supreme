<script setup>
import { ref, computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { enableConvexDevelopmentDeployment } from '@/src/config/convexRuntime.js'
import ConvexWorkspaceSync from '@/components/ConvexWorkspaceSync.vue'

if (import.meta.env.DEV) {
  enableConvexDevelopmentDeployment()
}
import Status from '@/components/ui/Status.vue'
import Checkbox from '@/components/ui/Checkbox.vue'
import CloseButton from '@/components/ui/CloseButton.vue'
import Divider from '@/components/ui/Divider.vue'
import DropdownSelector from '@/components/ui/DropdownSelector.vue'
import FilterButton from '@/components/ui/FilterButton.vue'
import GhostButton from '@/components/ui/GhostButton.vue'
import InputField from '@/components/ui/InputField.vue'
import PromoteButton from '@/components/ui/PromoteButton.vue'
import PromptWindow from '@/components/ui/PromptWindow.vue'
import PromptQuestion from '@/components/ui/PromptQuestion.vue'
import PromptResponse from '@/components/ui/PromptResponse.vue'
import LastUpdated from '@/components/ui/LastUpdated.vue'
import ThreeDotMenu from '@/components/ui/ThreeDotMenu.vue'
import AddButton from '@/components/ui/AddButton.vue'
import AssignedJob from '@/components/ui/AssignedJob.vue'
import Button from '@/components/ui/Button.vue'
import SearchField from '@/components/ui/SearchField.vue'
import TabSlider from '@/components/ui/TabSlider.vue'
import TabSwitcher from '@/components/ui/TabSwitcher.vue'
import Toolbar from '@/components/ui/Toolbar.vue'
import AppSidebar from '@/components/ui/AppSidebar.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import TagInput from '@/components/ui/TagInput.vue'
import ConditionPill from '@/components/ui/ConditionPill.vue'
import ConditionValue from '@/components/ui/ConditionValue.vue'
import ContextMenuItem from '@/components/ui/ContextMenuItem.vue'
import AlertMessage from '@/components/ui/AlertMessage.vue'
import Annotation from '@/components/ui/Annotation.vue'
import JobCard from '@/components/JobCard.vue'
import JobTemplateCard from '@/components/JobTemplateCard.vue'
import PageCard from '@/components/ui/PageCard.vue'
import PageFolder from '@/components/ui/PageFolder.vue'

const route = useRoute()

/** Left sidebar + floating Ask prompt on main app routes (Figma Sidebar 183:2548). */
const showAppSidebar = computed(
  () =>
    route.name === 'JobList' ||
    route.name === 'PageManager' ||
    route.name === 'Showcase' ||
    route.name === 'Analytics' ||
    route.name === 'Ask'
)

const searchQuery = ref('')

const showcaseInputFieldEmpty = ref('')
const showcaseInputFieldTyped = ref('Olsen & Breuner')

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
  'components/AnalyticsPage.vue',
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
  'components/ui/Divider.vue',
  'components/ui/DropdownSelector.vue',
  'components/ui/FilterButton.vue',
  'components/ui/GhostButton.vue',
  'components/ui/InputField.vue',
  'components/ui/AlertMessage.vue',
  'components/ui/Annotation.vue',
  'components/ui/AppSidebar.vue',
  'components/ui/PageCard.vue',
  'components/ui/PageFolder.vue',
  'components/ui/LastUpdated.vue',
  'components/ui/PromoteButton.vue',
  'components/ui/PromptWindow.vue',
  'components/ui/PromptQuestion.vue',
  'components/ui/PromptResponse.vue',
  'components/ui/SearchField.vue',
  'components/ui/Status.vue',
  'components/ui/TabSlider.vue',
  'components/ui/TabSwitcher.vue',
  'components/ui/TagInput.vue',
  'components/ui/ThreeDotMenu.vue',
  'components/ui/ToggleSwitch.vue',
  'components/ui/Toolbar.vue'
]

const checkbox1 = ref(false)
const checkbox2 = ref(true)
const checkbox3 = ref(false)
const checkboxDisabledUnchecked = ref(false)
const checkboxDisabledChecked = ref(true)
const toggleShowcaseOn = ref(true)
const toggleShowcaseOff = ref(false)

const tabSwitcherShowcase = ref(0)
const tabSwitcherShowcaseLabels = ref(1)

const tabSliderShowcase = ref(0)
const tabSliderShowcaseThree = ref(1)

const toolbarShowcase = ref(0)

const promptWindowShowcase = ref('')

const showcasePromptQuestionText =
  'What makes a career page stand out? Focus on design, content, and UX to attract top talent.'
const showcasePromptResponseText =
  'To build a standout career page, emphasize your company ethos, principles, and opportunities for professional development. Highlight what makes your company a great place to work.'

const tagInputLocationTags = ref(['Value 1', 'Value 2'])
const tagInputIndustryTags = ref(['Finance', 'Technology'])
const tagInputCompanyTags = ref(['Olsen & Breuner GmbH'])
const tagInputTitleTags = ref([])

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
  <div class="app" :class="{ 'app--with-sidebar': showAppSidebar }">
    <AppSidebar v-if="showAppSidebar" />
    <div class="app__column">
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
          <h2 class="section__title">Toggle Switch</h2>
          <p class="section__lead">
            <code class="section__code">components/ui/ToggleSwitch.vue</code> — Figma ToggleButton (<a class="app__link" href="https://www.figma.com/design/nwYunkFDexu6avl8C4E21v/CX-Editor---Modules?node-id=86-2673&t=K7hDmDSb30OJxxlq-1" target="_blank" rel="noopener noreferrer">86:2673</a>); includes active/inactive, disabled and focus states.
          </p>
          <div class="section__row section__row--wrap">
            <div class="cell">
              <span class="cell__label">Active</span>
              <ToggleSwitch v-model="toggleShowcaseOn" />
            </div>
            <div class="cell">
              <span class="cell__label">Inactive</span>
              <ToggleSwitch v-model="toggleShowcaseOff" />
            </div>
            <div class="cell">
              <span class="cell__label">Disabled active</span>
              <ToggleSwitch :model-value="true" disabled />
            </div>
            <div class="cell">
              <span class="cell__label">Disabled inactive</span>
              <ToggleSwitch :model-value="false" disabled />
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Input Field</h2>
          <p class="section__lead">
            <code class="section__code">components/ui/InputField.vue</code> — Figma InputField (<a class="app__link" href="https://www.figma.com/design/e5qpHSeHPsA5LAF0zfjhAU/UI-Kit?node-id=141-1334" target="_blank" rel="noopener noreferrer">141:1334</a>). Placeholder uses <code class="section__code">--color-text-tertiary</code>; typed value uses <code class="section__code">--color-text-secondary</code>.
          </p>
          <div class="section__row section__row--wrap">
            <div class="cell cell--input-field">
              <span class="cell__label">Placeholder</span>
              <InputField
                v-model="showcaseInputFieldEmpty"
                label="Template Name"
                placeholder="Olsen & Breuner"
              />
            </div>
            <div class="cell cell--input-field">
              <span class="cell__label">Typed</span>
              <InputField
                v-model="showcaseInputFieldTyped"
                label="Template Name"
                placeholder="Olsen & Breuner"
              />
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
          <h2 class="section__title">Filter Button</h2>
          <p class="section__lead">
            <code class="section__code">components/ui/FilterButton.vue</code> — Figma Filter (<a class="app__link" href="https://www.figma.com/design/e5qpHSeHPsA5LAF0zfjhAU/UI-Kit?node-id=146-792" target="_blank" rel="noopener noreferrer">146:792</a>); default / hover; active with count; active without count; disabled.
          </p>
          <div class="section__row section__row--wrap">
            <div class="cell">
              <span class="cell__label">Default / Hover</span>
              <FilterButton />
            </div>
            <div class="cell">
              <span class="cell__label">Active (count)</span>
              <FilterButton active :filter-count="2" />
            </div>
            <div class="cell">
              <span class="cell__label">Active (no count)</span>
              <FilterButton active :filter-count="0" />
            </div>
            <div class="cell">
              <span class="cell__label">Disabled</span>
              <FilterButton disabled />
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
          <h2 class="section__title">Divider</h2>
          <p class="section__lead">
            <code class="section__code">components/ui/Divider.vue</code> — Figma Divider (<a class="app__link" href="https://www.figma.com/design/e5qpHSeHPsA5LAF0zfjhAU/UI-Kit?node-id=158-1864" target="_blank" rel="noopener noreferrer">158:1864</a>); label uses <code class="section__code">.typography-divider-label</code> tokens (<code class="section__code">--color-border-strong</code> rule).
          </p>
          <div class="section__row section__row--wrap">
            <div class="cell cell--divider-showcase">
              <span class="cell__label">Default label</span>
              <Divider />
            </div>
            <div class="cell cell--divider-showcase">
              <span class="cell__label">Custom label</span>
              <Divider label="Assigned jobs" />
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
          <h2 class="section__title">Prompt window</h2>
          <p class="section__lead">
            <code class="section__code">components/ui/PromptWindow.vue</code> — Figma Prompt window (<a class="app__link" href="https://www.figma.com/design/e5qpHSeHPsA5LAF0zfjhAU/UI-Kit?node-id=186-2589" target="_blank" rel="noopener noreferrer">186:2589</a>); styling uses tokens from <code class="section__code">styles/tokens.css</code> only.
          </p>
          <div class="section__row section__row--wrap">
            <div class="cell cell--prompt-window">
              <span class="cell__label">Default</span>
              <PromptWindow v-model="promptWindowShowcase" />
              <p class="cell__hint">Value length: {{ promptWindowShowcase.length }} characters</p>
            </div>
            <div class="cell cell--prompt-window">
              <span class="cell__label">Disabled</span>
              <PromptWindow
                model-value="Sample prompt text"
                disabled
              />
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Prompt question &amp; Prompt response</h2>
          <p class="section__lead">
            <code class="section__code">components/ui/PromptQuestion.vue</code> — Figma Prompt (<a class="app__link" href="https://www.figma.com/design/e5qpHSeHPsA5LAF0zfjhAU/UI-Kit?node-id=198-1874" target="_blank" rel="noopener noreferrer">198:1874</a>);
            <code class="section__code">components/ui/PromptResponse.vue</code> — Figma Response (<a class="app__link" href="https://www.figma.com/design/e5qpHSeHPsA5LAF0zfjhAU/UI-Kit?node-id=198-1873" target="_blank" rel="noopener noreferrer">198:1873</a>).
            Styling uses <code class="section__code">styles/tokens.css</code> only.
          </p>
          <div class="section__row section__row--wrap">
            <div class="cell cell--prompt-chat">
              <span class="cell__label">PromptQuestion</span>
              <PromptQuestion :text="showcasePromptQuestionText" />
            </div>
            <div class="cell cell--prompt-chat">
              <span class="cell__label">PromptResponse</span>
              <PromptResponse :text="showcasePromptResponseText" />
            </div>
            <div class="cell cell--prompt-chat cell--prompt-chat--stack">
              <span class="cell__label">Paired</span>
              <div class="app__prompt-chat-stack">
                <PromptQuestion :text="showcasePromptQuestionText" />
                <PromptResponse :text="showcasePromptResponseText" />
              </div>
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
          <h2 class="section__title">Tab Slider</h2>
          <p class="section__lead">
            <code class="section__code">components/ui/TabSlider.vue</code> — Figma Tab Slider (<a class="app__link" href="https://www.figma.com/design/e5qpHSeHPsA5LAF0zfjhAU/UI-Kit?node-id=163-2204" target="_blank" rel="noopener noreferrer">163:2204</a>); white thumb slides to the selected segment.
          </p>
          <div class="section__row section__row--wrap">
            <div class="cell cell--tab-switcher">
              <span class="cell__label">Two segments</span>
              <TabSlider v-model="tabSliderShowcase" />
              <p class="cell__hint">Active index: {{ tabSliderShowcase }}</p>
            </div>
            <div class="cell cell--tab-switcher">
              <span class="cell__label">Three segments</span>
              <TabSlider
                v-model="tabSliderShowcaseThree"
                option-1-label="List"
                option-2-label="Board"
                option-3-label="Timeline"
              />
              <p class="cell__hint">Active index: {{ tabSliderShowcaseThree }}</p>
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
            <code class="section__code">components/ui/GhostButton.vue</code> — Figma Ghost Button (<a class="app__link" href="https://www.figma.com/design/e5qpHSeHPsA5LAF0zfjhAU/UI-Kit?node-id=123-1848" target="_blank" rel="noopener noreferrer">123:1848</a>); default / hover (tab or point); custom label; disabled.
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
          <p class="section__lead"><code class="section__code">components/ui/TagInput.vue</code> — Figma TagInput (84:6312). Icons: <code class="section__code">icons/location.svg</code>, <code class="section__code">industry.svg</code>, <code class="section__code">company.svg</code>, <code class="section__code">letters.svg</code> (Title). Location / industry / company: <code class="section__code">add</code> carries <code class="section__code">clientX</code>/<code class="section__code">clientY</code> for a menu at the pointer. Title: <code class="section__code">AddButton</code> or box/label click starts typing (hidden while composing).</p>
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
            <div class="cell cell--tag-input">
              <span class="cell__label">Title</span>
              <TagInput v-model="tagInputTitleTags" variant="title" />
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
            <JobTemplateCard
              :location-values="['Frankfurt + 2']"
              :industry-values="['Finance']"
              :company-values="['Olsen & Breuner']"
            />
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Page Card</h2>
          <p class="section__lead">
            <code class="section__code">components/ui/PageCard.vue</code> — Figma Page Card (<a class="app__link" href="https://www.figma.com/design/e5qpHSeHPsA5LAF0zfjhAU/UI-Kit?node-id=165-1720" target="_blank" rel="noopener noreferrer">165:1720</a>); selected state (<a class="app__link" href="https://www.figma.com/design/e5qpHSeHPsA5LAF0zfjhAU/UI-Kit?node-id=171-2023" target="_blank" rel="noopener noreferrer">171:2023</a>); thumbnail, frosted badges, title; styling uses <code class="section__code">tokens.css</code> variables only.
          </p>
          <div class="section__row section__row--wrap">
            <div class="cell cell--page-card">
              <span class="cell__label">Default</span>
              <PageCard :is-default="true" />
            </div>
            <div class="cell cell--page-card">
              <span class="cell__label">Selected</span>
              <PageCard title="New Page Test" :show-default-badge="false" selected />
            </div>
            <div class="cell cell--page-card">
              <span class="cell__label">Live only</span>
              <PageCard title="About us" :show-default-badge="false" />
            </div>
            <div class="cell cell--page-card">
              <span class="cell__label">No badges</span>
              <PageCard title="Imprint" :show-live="false" :show-default-badge="false" />
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">Page Folder</h2>
          <p class="section__lead">
            <code class="section__code">components/ui/PageFolder.vue</code> — Figma Page Folder (<a class="app__link" href="https://www.figma.com/design/e5qpHSeHPsA5LAF0zfjhAU/UI-Kit?node-id=169-1877" target="_blank" rel="noopener noreferrer">169:1877</a>); icon <code class="section__code">icons/folder.svg</code>; layout and type from <code class="section__code">tokens.css</code>.
          </p>
          <div class="section__row section__row--wrap">
            <div class="cell cell--page-folder">
              <span class="cell__label">Default</span>
              <PageFolder />
            </div>
            <div class="cell cell--page-folder">
              <span class="cell__label">Custom title</span>
              <PageFolder title="Careers section" />
            </div>
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

.app--with-sidebar {
  flex-direction: row;
  align-items: stretch;
}

.app__column {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
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

.cell--input-field {
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  min-width: 280px;
  max-width: 676px;
}

.cell--input-field .cell__label {
  min-width: 0;
  align-self: flex-start;
}

.cell--dropdown-locked {
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  min-height: 120px;
}

.cell--divider-showcase {
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  min-width: 0;
  max-width: 676px;
}

.cell--divider-showcase .cell__label {
  min-width: 0;
  align-self: flex-start;
}

.cell--prompt-window {
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-lg);
  min-width: 0;
  max-width: var(--layout-search-max-width);
  width: 100%;
}

.cell--prompt-window .cell__label {
  min-width: 0;
  align-self: flex-start;
}

.cell--prompt-chat {
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-lg);
  min-width: 0;
  max-width: 650px;
  width: 100%;
}

.cell--prompt-chat .cell__label {
  min-width: 0;
  align-self: flex-start;
}

.cell--prompt-chat--stack {
  max-width: 650px;
}

.app__prompt-chat-stack {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-lg);
  width: 100%;
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

.cell--page-card {
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-md);
  min-width: 0;
}

.cell--page-card .cell__label {
  min-width: 0;
  align-self: flex-start;
}

.cell--page-folder {
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-md);
  min-width: 0;
}

.cell--page-folder .cell__label {
  min-width: 0;
  align-self: flex-start;
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
