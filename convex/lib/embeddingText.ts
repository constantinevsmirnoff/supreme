import type { Doc } from '../_generated/dataModel'

export type EmbeddingNamespace =
  | 'job'
  | 'jobTemplate'
  | 'customPage'
  | 'customFolder'

const VOYAGE_MODEL = 'voyage-4-lite'

export function voyageEmbeddingModel (): string {
  return VOYAGE_MODEL
}

export function jobToEmbeddingText (d: Doc<'jobs'>): string {
  const parts = [
    'Job',
    `Title: ${d.jobTitle}`,
    `Company: ${d.company}`,
    `Location: ${d.location}`,
    `Industry: ${d.industry}`,
    `Active: ${d.active}`,
    `Last updated: ${d.lastUpdated}`,
    d.manualJobTemplate != null && d.manualJobTemplate !== ''
      ? `Manual template: ${d.manualJobTemplate}`
      : 'Manual template: (auto-assigned)'
  ]
  return parts.join('\n')
}

export function jobTemplateToEmbeddingText (d: Doc<'jobTemplates'>): string {
  const loc =
    (d.locationValues?.length ?? 0) > 0
      ? d.locationValues!.join(', ')
      : (d.locationEquals ?? 'Any location')
  const ind =
    (d.industryValues?.length ?? 0) > 0
      ? d.industryValues!.join(', ')
      : (d.industryEquals ?? 'Any industry')
  const comp =
    (d.companyValues?.length ?? 0) > 0
      ? d.companyValues!.join(', ')
      : (d.companyEquals ?? 'Any company')
  const titles =
    (d.titleValues?.length ?? 0) > 0
      ? d.titleValues!.join(', ')
      : 'Any job title substring'
  const parts = [
    'Job template',
    `Title: ${d.title}`,
    `Default: ${d.isDefault === true}`,
    `Template active: ${d.templateActive !== false}`,
    `Location conditions: ${loc}`,
    `Industry conditions: ${ind}`,
    `Company conditions: ${comp}`,
    `Job title substrings: ${titles}`,
    d.thumbnailFileName != null && d.thumbnailFileName !== ''
      ? `Thumbnail file: ${d.thumbnailFileName}`
      : null
  ].filter(Boolean) as string[]
  return parts.join('\n')
}

export function customPageToEmbeddingText (d: Doc<'customPages'>): string {
  const parent =
    d.parentFolderExternalId == null ? 'root' : d.parentFolderExternalId
  return [
    'Custom page',
    `Title: ${d.title}`,
    `External id: ${d.externalId}`,
    `Homepage: ${d.isHomepage}`,
    `Parent folder: ${parent}`
  ].join('\n')
}

export function customFolderToEmbeddingText (d: Doc<'customFolders'>): string {
  const parent =
    d.parentFolderExternalId == null ? 'root' : d.parentFolderExternalId
  return [
    'Custom folder',
    `Title: ${d.title}`,
    `External id: ${d.externalId}`,
    `Parent folder: ${parent}`
  ].join('\n')
}

export function buildEmbeddingText (
  namespace: EmbeddingNamespace,
  doc:
    | Doc<'jobs'>
    | Doc<'jobTemplates'>
    | Doc<'customPages'>
    | Doc<'customFolders'>
): string {
  switch (namespace) {
    case 'job':
      return jobToEmbeddingText(doc as Doc<'jobs'>)
    case 'jobTemplate':
      return jobTemplateToEmbeddingText(doc as Doc<'jobTemplates'>)
    case 'customPage':
      return customPageToEmbeddingText(doc as Doc<'customPages'>)
    case 'customFolder':
      return customFolderToEmbeddingText(doc as Doc<'customFolders'>)
  }
}
