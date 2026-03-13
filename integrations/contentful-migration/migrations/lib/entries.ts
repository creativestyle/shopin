/**
 * Entry creation: build fields from locale map, create + publish.
 * Single function to add const data to Contentful. No mapping helpers.
 */
import type { PlainClientAPI } from 'contentful-management'

function buildFieldsForLocales(
  fieldsByLocale: Record<string, Record<string, unknown>>
): Record<string, Record<string, unknown>> {
  const locales = Object.keys(fieldsByLocale)
  const fieldIds = new Set<string>()
  for (const loc of locales) {
    const o = fieldsByLocale[loc]
    if (o) {
      for (const id of Object.keys(o)) {
        fieldIds.add(id)
      }
    }
  }
  const fields: Record<string, Record<string, unknown>> = {}
  for (const id of fieldIds) {
    fields[id] = {}
    for (const loc of locales) {
      const v = fieldsByLocale[loc]?.[id]
      if (v !== undefined) {
        fields[id][loc] = v
      }
    }
  }
  return fields
}

export async function createEntryWithLocales(
  client: PlainClientAPI,
  contentTypeId: string,
  fieldsByLocale: Record<string, Record<string, unknown>>
): Promise<string> {
  const entry = await client.entry.create(
    { contentTypeId },
    { fields: buildFieldsForLocales(fieldsByLocale) }
  )
  await client.entry.publish({ entryId: entry.sys.id }, entry)
  return entry.sys.id
}

/** Create multiple link entries from payloads; returns entry ids in order. */
export async function createLinkEntries(
  client: PlainClientAPI,
  payloads: Record<string, Record<string, unknown>>[]
): Promise<string[]> {
  const ids: string[] = []
  for (const link of payloads) {
    ids.push(await createEntryWithLocales(client, 'link', link))
  }
  return ids
}
