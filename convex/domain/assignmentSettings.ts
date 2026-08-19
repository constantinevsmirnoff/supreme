export const ASSIGNMENT_SETTINGS_KEY = 'global'

export const ASSIGNMENT_ATTRIBUTES = [
  'location',
  'industry',
  'company',
  'title'
] as const

export type AssignmentAttribute = (typeof ASSIGNMENT_ATTRIBUTES)[number]

function isAssignmentAttribute (value: string): value is AssignmentAttribute {
  return (ASSIGNMENT_ATTRIBUTES as readonly string[]).includes(value)
}

export function normalizeAssignmentAttributes (
  values: unknown
): AssignmentAttribute[] {
  if (!Array.isArray(values)) return []
  const seen = new Set<AssignmentAttribute>()
  const out: AssignmentAttribute[] = []
  for (const raw of values) {
    if (typeof raw !== 'string') continue
    if (!isAssignmentAttribute(raw)) continue
    if (seen.has(raw)) continue
    seen.add(raw)
    out.push(raw)
  }
  return out
}

export async function loadAssignmentActiveAttributes (ctx: {
  db: {
    query: (table: 'assignmentSettings') => {
      withIndex: (
        name: 'by_key',
        fn: (q: { eq: (field: 'key', value: string) => unknown }) => unknown
      ) => { unique: () => Promise<{ activeAttributes?: unknown } | null> }
    }
  }
}): Promise<AssignmentAttribute[]> {
  const doc = await ctx.db
    .query('assignmentSettings')
    .withIndex('by_key', (q) => q.eq('key', ASSIGNMENT_SETTINGS_KEY))
    .unique()
  return normalizeAssignmentAttributes(doc?.activeAttributes ?? [])
}
