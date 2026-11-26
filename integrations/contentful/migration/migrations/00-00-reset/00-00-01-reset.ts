/**
 * Reset: deletes all entries and content types created by these migrations.
 * Uses contentful-management client directly.
 * Catches only 404 when unpublish/delete (resource already gone); rethrows other errors.
 */
import type { PlainClientAPI } from 'contentful-management'
import { CONTENT_TYPE_IDS } from '../lib/content-types/ids'
import { getManagementClient } from '../lib/client'
import { isNotFoundError } from '../lib/errors'

const BATCH_SIZE = 100

type EntryItem = NonNullable<
  Awaited<ReturnType<PlainClientAPI['entry']['getMany']>>['items']
>[number]

/** Runs fn and swallows 404; rethrows any other error. Returns true if 404 was swallowed. */
async function ignoreNotFound<T>(
  fn: () => Promise<T>
): Promise<{ notFound: boolean }> {
  try {
    await fn()
    return { notFound: false }
  } catch (e: unknown) {
    if (isNotFoundError(e)) {
      return { notFound: true }
    }
    throw e
  }
}

async function getExistingContentTypeIds(
  client: PlainClientAPI
): Promise<Set<string>> {
  const existingIds = new Set<string>()
  let offset = 0
  let items: Awaited<ReturnType<typeof client.contentType.getMany>>['items']
  do {
    const res = await client.contentType.getMany({
      query: { limit: BATCH_SIZE, skip: offset },
    })
    items = res.items ?? []
    for (const ct of items) {
      if (ct.sys?.id) {
        existingIds.add(ct.sys.id)
      }
    }
    offset += BATCH_SIZE
  } while (items.length === BATCH_SIZE)
  return existingIds
}

async function deleteOneEntry(
  client: PlainClientAPI,
  entry: EntryItem
): Promise<void> {
  if (entry.sys.publishedVersion != null) {
    const { notFound } = await ignoreNotFound(() =>
      client.entry.unpublish({ entryId: entry.sys.id }, entry)
    )
    if (notFound) {
      return
    }
    const next = await client.entry.get({ entryId: entry.sys.id })
    await client.entry.delete({ entryId: next.sys.id })
  } else {
    await client.entry.delete({ entryId: entry.sys.id })
  }
}

async function deleteEntriesOfType(
  client: PlainClientAPI,
  contentTypeId: string
): Promise<void> {
  let items: Awaited<ReturnType<typeof client.entry.getMany>>['items']
  do {
    const res = await client.entry.getMany({
      query: { content_type: contentTypeId, limit: BATCH_SIZE, skip: 0 },
    })
    items = res.items ?? []
    for (const entry of items) {
      await deleteOneEntry(client, entry)
    }
  } while (items.length === BATCH_SIZE)
}

async function deleteOneContentType(
  client: PlainClientAPI,
  contentTypeId: string
): Promise<void> {
  await ignoreNotFound(async () => {
    const ct = await client.contentType.get({ contentTypeId })
    if (ct.sys.publishedVersion != null) {
      await ignoreNotFound(() =>
        client.contentType.unpublish({ contentTypeId })
      )
    }
    await client.contentType.delete({ contentTypeId })
  })
}

async function deleteAllEntries(
  client: PlainClientAPI,
  existingContentTypeIds: Set<string>
): Promise<void> {
  const toProcess = CONTENT_TYPE_IDS.filter((id) =>
    existingContentTypeIds.has(id)
  )
  for (const contentTypeId of toProcess) {
    await deleteEntriesOfType(client, contentTypeId)
  }
}

async function deleteAllContentTypes(
  client: PlainClientAPI,
  existingContentTypeIds: Set<string>
): Promise<void> {
  const toProcess = CONTENT_TYPE_IDS.filter((id) =>
    existingContentTypeIds.has(id)
  )
  for (const contentTypeId of toProcess) {
    await deleteOneContentType(client, contentTypeId)
  }
}

async function run(migration: unknown) {
  const client = getManagementClient(migration)
  const existingIds = await getExistingContentTypeIds(client)

  await deleteAllEntries(client, existingIds)
  await deleteAllContentTypes(client, existingIds)
}

export = run
