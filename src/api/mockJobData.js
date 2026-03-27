/**
 * Shared mock pools for jobs and job-template condition matching.
 * Keep in sync with generated job rows in jobs.js.
 * Each job uses exactly one city from this list (see jobs.js).
 */

export const LOCATIONS = ['Berlin', 'Hamburg', 'München', 'Köln']

export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Retail',
  'Manufacturing',
  'Consulting',
  'Education',
  'Media'
]

/** Exactly three employers; jobs cycle through these (see jobs.js). */
export const COMPANIES = [
  'Olsen & Breuner GmbH',
  'Tech Solutions AG',
  'Nordic Health Plus'
]
