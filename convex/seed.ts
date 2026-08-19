import { internal } from './_generated/api'
import { mutation } from './_generated/server'
import type { MutationCtx } from './_generated/server'
import { v } from 'convex/values'
import { ASSIGNMENT_SETTINGS_KEY } from './domain/assignmentSettings'

/** Static thumbnails in `public/custom-page-thumbs/` (Vite serves at site root). */
const CUSTOM_PAGE_PUBLIC_THUMBNAILS: Record<string, string> = {
  'page-1': '/custom-page-thumbs/page-1.png',
  'page-2': '/custom-page-thumbs/page-2.png',
  'page-3': '/custom-page-thumbs/page-3.png',
  'page-4': '/custom-page-thumbs/page-4.png',
  'page-5': '/custom-page-thumbs/page-5.png'
}

function publicThumbnailForCustomPage (externalId: string): string {
  return CUSTOM_PAGE_PUBLIC_THUMBNAILS[externalId] ?? ''
}

const CUSTOM_PAGE_SEED_ROWS: Array<{
  externalId: string
  title: string
  isHomepage: boolean
}> = [
  { externalId: 'page-1', title: 'Careers Home', isHomepage: true },
  {
    externalId: 'page-2',
    title: 'Life at Olsen & Breuner',
    isHomepage: false
  },
  {
    externalId: 'page-3',
    title: 'Early Careers & Internships',
    isHomepage: false
  },
  { externalId: 'page-4', title: 'Meet the Team', isHomepage: false },
  { externalId: 'page-5', title: 'DEI & Belonging', isHomepage: false },
  {
    externalId: 'page-6',
    title: 'Engineering at Nord Labs',
    isHomepage: false
  },
  {
    externalId: 'page-7',
    title: 'Benefits & Wellbeing',
    isHomepage: false
  },
  {
    externalId: 'page-8',
    title: 'Our Hiring Process',
    isHomepage: false
  },
  {
    externalId: 'page-9',
    title: 'Stories & Perspectives from Our Teams',
    isHomepage: false
  },
  {
    externalId: 'page-10',
    title: 'Contact Talent Acquisition',
    isHomepage: false
  }
]

async function ensureCustomPagesSeeded (ctx: MutationCtx): Promise<void> {
  const existing = await ctx.db.query('customPages').take(1)
  if (existing.length > 0) return
  for (const row of CUSTOM_PAGE_SEED_ROWS) {
    await ctx.db.insert('customPages', {
      externalId: row.externalId,
      title: row.title,
      thumbnail: publicThumbnailForCustomPage(row.externalId),
      isHomepage: row.isHomepage,
      parentFolderExternalId: null
    })
  }
}

/** Keep first five pages aligned with shipped assets (idempotent for existing DBs). */
/** Backfill `parentFolderExternalId: null` for docs created before folder support. */
async function syncCustomPagesParentFolderRoot (ctx: MutationCtx): Promise<void> {
  const all = await ctx.db.query('customPages').collect()
  for (const d of all) {
    if (d.parentFolderExternalId === undefined) {
      await ctx.db.patch(d._id, { parentFolderExternalId: null })
    }
  }
}

async function syncFirstFiveCustomPageThumbnails (
  ctx: MutationCtx
): Promise<void> {
  for (const externalId of Object.keys(CUSTOM_PAGE_PUBLIC_THUMBNAILS)) {
    const thumbnail = CUSTOM_PAGE_PUBLIC_THUMBNAILS[externalId]
    const doc = await ctx.db
      .query('customPages')
      .withIndex('by_externalId', (q) => q.eq('externalId', externalId))
      .unique()
    if (doc == null) continue
    if (doc.thumbnail === thumbnail) continue
    await ctx.db.patch(doc._id, { thumbnail })
  }
}

async function ensureAssignmentSettingsSeeded (ctx: MutationCtx): Promise<void> {
  const doc = await ctx.db
    .query('assignmentSettings')
    .withIndex('by_key', (q) => q.eq('key', ASSIGNMENT_SETTINGS_KEY))
    .unique()
  if (doc != null) return
  await ctx.db.insert('assignmentSettings', {
    key: ASSIGNMENT_SETTINGS_KEY,
    activeAttributes: []
  })
}

const LOCATIONS = ['Berlin', 'Hamburg', 'München', 'Köln']
const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Retail',
  'Manufacturing',
  'Consulting',
  'Education',
  'Media'
]
const COMPANIES = [
  'Olsen & Breuner GmbH',
  'Tech Solutions AG',
  'Nordic Health Plus'
]

const TITLE_PREFIXES = [
  'Expert Support',
  'Senior',
  'Junior',
  'Lead',
  'Principal',
  'Staff',
  'Associate',
  'Specialist'
]

const TITLE_SUFFIXES = [
  'Sales Academy (m/w/d)',
  'Engineer (m/w/d)',
  'Developer (m/w/d)',
  'Analyst (m/w/d)',
  'Consultant (m/w/d)',
  'Manager (m/w/d)',
  'Coordinator (m/w/d)',
  'Designer (m/w/d)'
]

function pad (n: number): string {
  return String(n).padStart(2, '0')
}

function randomDate (startYear: number, endYear: number): string {
  const year = startYear + Math.floor(Math.random() * (endYear - startYear + 1))
  const month = 1 + Math.floor(Math.random() * 12)
  const day = 1 + Math.floor(Math.random() * 28)
  return `${pad(day)}/${pad(month)}/${year}`
}

function pick<T> (arr: T[], i: number): T {
  return arr[i % arr.length]
}

/** Idempotent: only inserts when tables are empty. */
export const seedIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existingJobs = await ctx.db.query('jobs').take(1)
    if (existingJobs.length > 0) {
      await ensureCustomPagesSeeded(ctx)
      await syncCustomPagesParentFolderRoot(ctx)
      await syncFirstFiveCustomPageThumbnails(ctx)
      await ensureAssignmentSettingsSeeded(ctx)
      return { seeded: false }
    }

    for (let i = 0; i < 75; i++) {
      const prefix = pick(TITLE_PREFIXES, i)
      const suffix = pick(TITLE_SUFFIXES, i * 3 + 1)
      await ctx.db.insert('jobs', {
        externalId: `job-${i + 1}`,
        jobTitle: `${prefix} ${suffix}`,
        location: pick(LOCATIONS, i),
        industry: pick(INDUSTRIES, i),
        company: pick(COMPANIES, i),
        active: i % 5 !== 2,
        lastUpdated: randomDate(2024, 2025)
      })
    }

    await ctx.db.insert('jobTemplates', {
      externalId: 'tpl-10',
      title: 'Standard Job Page',
      thumbnail: '',
      isDefault: true,
      locationEquals: null,
      industryEquals: null,
      companyEquals: null,
      conditionsEditedAt: 0,
      templateActive: true
    })

    await ensureCustomPagesSeeded(ctx)
    await syncCustomPagesParentFolderRoot(ctx)
    await syncFirstFiveCustomPageThumbnails(ctx)
    await ensureAssignmentSettingsSeeded(ctx)

    await ctx.scheduler.runAfter(0, internal.embeddings.backfillEmbeddingsStep, {})

    return { seeded: true }
  }
})
