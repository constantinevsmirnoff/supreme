/**
 * Mock jobs API — returns 75 job entries for the Job List screen.
 * Each job: id, jobTitle, location, industry, company, jobTemplate, active, lastUpdated (dd/mm/yyyy).
 * jobTemplate is filled by assignTemplatesToJobs after fetch (see JobList / PageManager).
 * Non-default templates assign only when `templateActive !== false` on the template.
 */

import { LOCATIONS, INDUSTRIES, COMPANIES } from '@/src/api/mockJobData.js'

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

function pad (n) {
  return String(n).padStart(2, '0')
}

function randomDate (startYear, endYear) {
  const year = startYear + Math.floor(Math.random() * (endYear - startYear + 1))
  const month = 1 + Math.floor(Math.random() * 12)
  const day = 1 + Math.floor(Math.random() * 28)
  return `${pad(day)}/${pad(month)}/${year}`
}

function pick (arr, i) {
  return arr[i % arr.length]
}

/**
 * @returns {Promise<Array<{ id: string, jobTitle: string, location: string, industry: string, company: string, jobTemplate: string, active: boolean, lastUpdated: string }>>}
 */
export function fetchJobs () {
  const jobs = []
  for (let i = 0; i < 75; i++) {
    const prefix = pick(TITLE_PREFIXES, i)
    const suffix = pick(TITLE_SUFFIXES, i * 3 + 1)
    jobs.push({
      id: `job-${i + 1}`,
      jobTitle: `${prefix} ${suffix}`,
      location: pick(LOCATIONS, i),
      industry: pick(INDUSTRIES, i),
      company: pick(COMPANIES, i),
      jobTemplate: '',
      active: i % 5 !== 2,
      lastUpdated: randomDate(2024, 2025)
    })
  }
  return Promise.resolve(jobs)
}
