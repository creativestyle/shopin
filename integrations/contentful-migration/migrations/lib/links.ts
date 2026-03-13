/**
 * Link/asset ref types and entry field helpers (get link ids, localized values).
 */
import type { EntryProps } from 'contentful-management'

export interface EntryLinkRef {
  sys: { type: 'Link'; linkType: 'Entry'; id: string }
}

export interface AssetLinkRef {
  sys: { type: 'Link'; linkType: 'Asset'; id: string }
}

/** Build an entry link ref for Contentful (used in fields). */
export function toEntryRef(id: string): EntryLinkRef {
  return { sys: { type: 'Link', linkType: 'Entry', id } }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object'
}

export function getLinkId(link: unknown): string | undefined {
  if (!isRecord(link)) {
    return undefined
  }
  const sys = link.sys
  if (!isRecord(sys)) {
    return undefined
  }
  const id = sys.id
  return typeof id === 'string' ? id : undefined
}

export function getEntryLinkIds(
  entry: EntryProps,
  fieldId: string,
  locale: string
): string[] {
  const fieldValue = entry.fields?.[fieldId]?.[locale]
  const links =
    fieldValue == null
      ? []
      : Array.isArray(fieldValue)
        ? fieldValue
        : [fieldValue]
  return links.map(getLinkId).filter((id): id is string => id != null)
}

export function getLocalizedString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function getLocalizedArrayLength(
  entry: EntryProps,
  fieldId: string,
  locale: string
): number {
  const fieldValue = entry.fields?.[fieldId]?.[locale]
  return Array.isArray(fieldValue)
    ? fieldValue.length
    : fieldValue != null
      ? 1
      : 0
}
