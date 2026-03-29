import { mutation } from './_generated/server'
import { v } from 'convex/values'

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

    return { seeded: true }
  }
})
