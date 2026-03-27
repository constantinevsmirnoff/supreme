import { createRouter, createWebHistory } from 'vue-router'
import JobList from '@/components/JobList.vue'
import PageManager from '@/components/PageManager.vue'

/** Placeholder so `/` matches the Showcase tab; UI is rendered in App.vue */
const ShowcaseRoutePlaceholder = {
  render () {
    return null
  }
}

const routes = [
  { path: '/', name: 'Showcase', component: ShowcaseRoutePlaceholder },
  { path: '/jobs', name: 'JobList', component: JobList },
  { path: '/page-manager', name: 'PageManager', component: PageManager }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
