/**
 * Helpers for page + component content migrations. Minimal API to cut boilerplate.
 */
import { existsSync, readFileSync } from 'node:fs'
import type { PlainClientAPI } from 'contentful-management'
import type { EntryProps } from 'contentful-management'
import { getEntryLinkIds, getLinkId, getLocalizedString } from './links'
import { createEntryWithLocales } from './entries'
import { DEFAULT_LOCALE, LOCALES } from './constants'

const ENTRY_QUERY_LIMIT = 100

/**
 * contentful-management defaults to ~30s polling for asset.processForLocale (3s × 10).
 * Demo migrations upload many assets; Contentful processing can exceed that under load.
 */
const ASSET_PROCESS_FOR_LOCALE_OPTIONS = {
  processingCheckWait: 3000,
  processingCheckRetries: 45,
} as const

/** Paginate entries by content type until predicate matches; returns first match or undefined. */
async function findEntry(
  client: PlainClientAPI,
  contentType: string,
  predicate: (entry: EntryProps) => boolean
): Promise<EntryProps | undefined> {
  let skip = 0
  for (;;) {
    const res = await client.entry.getMany({
      query: { content_type: contentType, limit: ENTRY_QUERY_LIMIT, skip },
    })
    const items = res.items ?? []
    const found = items.find(predicate)
    if (found) {
      return found
    }
    if (items.length < ENTRY_QUERY_LIMIT) {
      break
    }
    skip += ENTRY_QUERY_LIMIT
  }
  return undefined
}

/** Find a page entry by its default-locale slug. Returns undefined if not found. */
export async function getPageBySlug(
  client: PlainClientAPI,
  slug: string
): Promise<EntryProps | undefined> {
  return findEntry(
    client,
    'page',
    (e) => e.fields?.slug?.[DEFAULT_LOCALE] === slug
  )
}

/** Find a link entry by its default-locale url. Returns entry id or undefined. */
export async function getLinkEntryIdByUrl(
  client: PlainClientAPI,
  url: string
): Promise<string | undefined> {
  const trimmed = url.trim()
  const found = await findEntry(
    client,
    'link',
    (e) => e.fields?.url?.[DEFAULT_LOCALE]?.trim() === trimmed
  )
  return found?.sys.id
}

/** Link payload keyed by locale (see LOCALES). */
type LinkPayloadByLocale = Record<string, Record<string, unknown>>

/**
 * Get existing link entry by url, or create one (with linkedPage set when the page exists).
 * If an existing link is found, updates its linkedPage when the page exists (so callers can reuse the same helper).
 */
export async function getOrCreateLinkForPage(
  client: PlainClientAPI,
  basePayload: LinkPayloadByLocale,
  pageSlug: string
): Promise<string> {
  const url = String(basePayload[DEFAULT_LOCALE]?.url ?? '').trim()
  const existingId = await getLinkEntryIdByUrl(client, url)
  const page = await getPageBySlug(client, pageSlug)
  const linkedPageRef = page
    ? {
        sys: {
          type: 'Link' as const,
          linkType: 'Entry' as const,
          id: page.sys.id,
        },
      }
    : undefined

  if (existingId) {
    if (linkedPageRef) {
      const linkEntry = await client.entry.get({ entryId: existingId })
      const linkedPageValue = Object.fromEntries(
        LOCALES.map((loc) => [loc, linkedPageRef])
      ) as Record<string, typeof linkedPageRef>
      const updated = await client.entry.update(
        { entryId: existingId },
        {
          ...linkEntry,
          fields: {
            ...linkEntry.fields,
            linkedPage: linkedPageValue,
          },
        }
      )
      await client.entry.publish({ entryId: existingId }, updated)
    }
    return existingId
  }

  const payload: LinkPayloadByLocale = linkedPageRef
    ? (Object.fromEntries(
        LOCALES.map((loc) => [
          loc,
          { ...basePayload[loc], linkedPage: linkedPageRef },
        ])
      ) as LinkPayloadByLocale)
    : basePayload
  return createEntryWithLocales(client, 'link', payload)
}

export async function getOrCreatePage(
  client: PlainClientAPI,
  slug: string,
  pageFieldsByLocale: Record<string, Record<string, unknown>>
): Promise<{ page: EntryProps; created: boolean }> {
  const existing = await getPageBySlug(client, slug)
  if (existing) {
    return { page: existing, created: false }
  }
  const id = await createEntryWithLocales(client, 'page', {
    ...Object.fromEntries(
      LOCALES.map((loc) => [
        loc,
        { ...pageFieldsByLocale[loc], components: [] },
      ])
    ),
  } as Record<string, Record<string, unknown>>)
  const page = await client.entry.get({ entryId: id })
  return { page, created: true }
}

type ComponentSpec = {
  contentTypeId: string
  fields: Record<string, Record<string, unknown>>
}

/** Set page components to given entry ids (all locales), update + publish. */
export async function setPageComponents(
  client: PlainClientAPI,
  page: EntryProps,
  componentIds: string[]
): Promise<EntryProps> {
  const ref = (id: string) => ({
    sys: { type: 'Link' as const, linkType: 'Entry' as const, id },
  })
  const refs = componentIds.map(ref)
  const updated = await client.entry.update(
    { entryId: page.sys.id },
    {
      ...page,
      fields: {
        ...page.fields,
        components: Object.fromEntries(LOCALES.map((loc) => [loc, refs])),
      },
    }
  )
  const published = await client.entry.publish(
    { entryId: updated.sys.id },
    updated
  )
  return published
}

export async function populatePageWithComponents(
  client: PlainClientAPI,
  page: EntryProps,
  specs: ComponentSpec[]
): Promise<EntryProps> {
  const ids: string[] = []
  for (const { contentTypeId, fields } of specs) {
    ids.push(await createEntryWithLocales(client, contentTypeId, fields))
  }
  return setPageComponents(client, page, ids)
}

/** Map file extension to Contentful asset contentType (image MIME types). */
const IMAGE_MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  ico: 'image/x-icon',
}

function getImageContentType(fileName: string, explicit?: string): string {
  if (explicit) {
    return explicit
  }
  const ext = fileName.split('.').pop()?.toLowerCase()
  return (ext && IMAGE_MIME_BY_EXT[ext]) ?? 'image/jpeg'
}

/**
 * Create, process and publish an image asset; returns the asset ID.
 * Use when you need an asset ID before creating entries (e.g. rich text with embedded-asset-block).
 * Also used internally by attachImageToEntry.
 */
export async function createImageAsset(
  client: PlainClientAPI,
  opts: { title: string; url: string; fileName: string; contentType?: string },
  locales: string[] = [DEFAULT_LOCALE]
): Promise<string> {
  const contentType = getImageContentType(opts.fileName, opts.contentType)
  const filePayload = {
    contentType,
    fileName: opts.fileName,
    upload: opts.url,
  }
  const title: Record<string, string> = {}
  const file: Record<
    string,
    { contentType: string; fileName: string; upload: string }
  > = {}
  for (const loc of locales) {
    title[loc] = opts.title
    file[loc] = filePayload
  }
  const asset = await client.asset.create({}, { fields: { title, file } })
  let accumulatedAsset: typeof asset = asset
  for (const loc of locales) {
    const processed = await client.asset.processForLocale(
      {},
      accumulatedAsset,
      loc,
      ASSET_PROCESS_FOR_LOCALE_OPTIONS
    )
    const processedFileForLocale = processed.fields?.file?.[loc]
    accumulatedAsset = {
      ...processed,
      fields: {
        ...processed.fields,
        file: {
          ...(accumulatedAsset.fields?.file ?? {}),
          ...(processedFileForLocale && { [loc]: processedFileForLocale }),
        },
      },
    }
  }
  await client.asset.publish(
    { assetId: accumulatedAsset.sys.id },
    accumulatedAsset
  )
  return accumulatedAsset.sys.id
}

/**
 * Create, process and publish an image asset from a local file (binary upload).
 * Use when the image is not available at a public HTTP URL.
 */
export async function createImageAssetFromLocalFile(
  client: PlainClientAPI,
  opts: {
    title: string
    absoluteFilePath: string
    fileName: string
    contentType?: string
  },
  locales: string[] = [DEFAULT_LOCALE]
): Promise<string> {
  if (!existsSync(opts.absoluteFilePath)) {
    throw new Error(`Asset file not found: ${opts.absoluteFilePath}`)
  }
  const fileBuffer = readFileSync(opts.absoluteFilePath)
  const arrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength
  )
  const upload = await client.upload.create({}, { file: arrayBuffer })
  const uploadId = upload.sys?.id
  if (!uploadId) {
    throw new Error(
      'createImageAssetFromLocalFile: upload response missing sys.id'
    )
  }
  const contentType = getImageContentType(opts.fileName, opts.contentType)
  const filePayload = {
    contentType,
    fileName: opts.fileName,
    uploadFrom: {
      sys: {
        type: 'Link' as const,
        linkType: 'Upload' as const,
        id: uploadId,
      },
    },
  }
  const title: Record<string, string> = {}
  const file: Record<string, typeof filePayload> = {}
  for (const loc of locales) {
    title[loc] = opts.title
    file[loc] = filePayload
  }
  const asset = await client.asset.create({}, { fields: { title, file } })
  let accumulatedAsset: typeof asset = asset
  for (const loc of locales) {
    const processed = await client.asset.processForLocale(
      {},
      accumulatedAsset,
      loc,
      ASSET_PROCESS_FOR_LOCALE_OPTIONS
    )
    const processedFileForLocale = processed.fields?.file?.[loc]
    accumulatedAsset = {
      ...processed,
      fields: {
        ...processed.fields,
        file: {
          ...(accumulatedAsset.fields?.file ?? {}),
          ...(processedFileForLocale && { [loc]: processedFileForLocale }),
        },
      },
    }
  }
  await client.asset.publish(
    { assetId: accumulatedAsset.sys.id },
    accumulatedAsset
  )
  return accumulatedAsset.sys.id
}

export async function attachImageToEntry(
  client: PlainClientAPI,
  entryId: string,
  fieldId: string,
  locales: string | string[],
  opts: { title: string; url: string; fileName: string; contentType?: string }
): Promise<void> {
  const localeList: string[] = Array.isArray(locales) ? [...locales] : [locales]
  const firstLocale = localeList[0]
  if (!firstLocale) {
    throw new Error('attachImageToEntry: at least one locale required')
  }
  const assetId = await createImageAsset(client, opts, localeList)
  const link = {
    sys: {
      type: 'Link' as const,
      linkType: 'Asset' as const,
      id: assetId,
    },
  }
  const entry = await client.entry.get({ entryId })
  const fieldValue: Record<string, typeof link> = {}
  for (const loc of localeList) {
    fieldValue[loc] = link
  }
  const updated = await client.entry.update(
    { entryId },
    {
      ...entry,
      fields: {
        ...entry.fields,
        [fieldId]: fieldValue,
      },
    }
  )
  await client.entry.publish({ entryId: updated.sys.id }, updated)
}

export async function attachImageToEntryFromLocalFile(
  client: PlainClientAPI,
  entryId: string,
  fieldId: string,
  locales: string | string[],
  opts: {
    title: string
    absoluteFilePath: string
    fileName: string
    contentType?: string
  }
): Promise<void> {
  const localeList: string[] = Array.isArray(locales) ? [...locales] : [locales]
  const firstLocale = localeList[0]
  if (!firstLocale) {
    throw new Error(
      'attachImageToEntryFromLocalFile: at least one locale required'
    )
  }
  const assetId = await createImageAssetFromLocalFile(client, opts, localeList)
  const link = {
    sys: {
      type: 'Link' as const,
      linkType: 'Asset' as const,
      id: assetId,
    },
  }
  const entry = await client.entry.get({ entryId })
  const fieldValue: Record<string, typeof link> = {}
  for (const loc of localeList) {
    fieldValue[loc] = link
  }
  const updated = await client.entry.update(
    { entryId },
    {
      ...entry,
      fields: {
        ...entry.fields,
        [fieldId]: fieldValue,
      },
    }
  )
  await client.entry.publish({ entryId: updated.sys.id }, updated)
}

/** First teaserImage in page's components that has no image. */
export async function findFirstTeaserImageWithoutAsset(
  client: PlainClientAPI,
  page: EntryProps,
  locale: string
): Promise<{ entryId: string; title: string } | null> {
  const ids = getEntryLinkIds(page, 'components', locale)
  if (ids.length === 0) {
    return null
  }
  const res = await client.entry.getMany({
    query: { 'sys.id[in]': ids.join(','), 'limit': 100 },
  })
  const imageTeaser = (res.items ?? []).find(
    (e) => e.sys?.contentType?.sys?.id === 'teaserImage'
  )
  if (!imageTeaser || getLinkId(imageTeaser.fields?.image?.[locale])) {
    return null
  }
  return {
    entryId: imageTeaser.sys.id,
    title: getLocalizedString(imageTeaser.fields?.title?.[locale]) || 'Image',
  }
}

/** Set page's parentPage to the page with the given slug (all locales), then publish. No-op if parent not found. */
export async function ensureParentPage(
  client: PlainClientAPI,
  pageEntry: EntryProps,
  parentSlug: string
): Promise<EntryProps | null> {
  const parent = await getPageBySlug(client, parentSlug)
  if (!parent) {
    return null
  }
  const ref = {
    sys: {
      type: 'Link' as const,
      linkType: 'Entry' as const,
      id: parent.sys.id,
    },
  }
  const updated = await client.entry.update(
    { entryId: pageEntry.sys.id },
    {
      ...pageEntry,
      fields: {
        ...pageEntry.fields,
        parentPage: Object.fromEntries(LOCALES.map((loc) => [loc, ref])),
      },
    }
  )
  const published = await client.entry.publish(
    { entryId: updated.sys.id },
    updated
  )
  return published
}

/** Config for attachTeaserAndOgImages. */
export type PageImageConfig = {
  teaser: { url: string; fileName: string }
  og: { title: string; url: string; fileName: string }
}

/** Attach image to first teaserImage without asset, then attach ogImage to page. */
export async function attachTeaserAndOgImages(
  client: PlainClientAPI,
  pageEntry: EntryProps,
  config: PageImageConfig
): Promise<void> {
  const imageTeaser = await findFirstTeaserImageWithoutAsset(
    client,
    pageEntry,
    DEFAULT_LOCALE
  )
  if (imageTeaser) {
    await attachImageToEntry(
      client,
      imageTeaser.entryId,
      'image',
      [...LOCALES],
      {
        title: imageTeaser.title,
        url: config.teaser.url,
        fileName: config.teaser.fileName,
      }
    )
  }
  await attachImageToEntry(client, pageEntry.sys.id, 'ogImage', [...LOCALES], {
    title: config.og.title,
    url: config.og.url,
    fileName: config.og.fileName,
  })
}

/** Throws if any entry of the given content type exists. Use before creating singletons (footer, topBar). */
export async function ensureNoEntryOfType(
  client: PlainClientAPI,
  contentTypeId: string,
  message?: string
): Promise<void> {
  const res = await client.entry.getMany({
    query: { content_type: contentTypeId, limit: 1 },
  })
  if ((res.items?.length ?? 0) > 0) {
    throw new Error(message ?? `${contentTypeId} content already exists`)
  }
}
