import {
  RawPageDataSchema,
  RichTextNodeForCollectSchema,
  type RichTextNodeForCollect,
  type RichTextLinks,
  type AssetItem,
  type EntryItem,
} from '../schemas'

/** Rich text field as returned by Contentful GraphQL; `links` is injected after resolution. */
type RichTextField = { json?: unknown; links?: RichTextLinks }

export type PageLinkIds = { assetIds: string[]; entryIds: string[] }

const ASSET_NODE_TYPES = new Set(['embedded-asset-block', 'asset-hyperlink'])

function isRichTextField(value: unknown): value is RichTextField {
  return typeof value === 'object' && value !== null && 'json' in value
}

/** Returns the rich text fields of a teaser entry that may contain asset or entry links. */
function getRichTextFields(entry: unknown): RichTextField[] {
  const e = entry as {
    __typename?: string
    richText?: unknown
    accordion?: { itemsCollection?: { items?: Array<{ body?: unknown }> } }
  } | null
  if (e?.__typename === 'TeaserRichText') {
    return isRichTextField(e.richText) ? [e.richText] : []
  }
  if (e?.__typename === 'TeaserAccordion') {
    return (e.accordion?.itemsCollection?.items ?? [])
      .map((item) => item?.body)
      .filter(isRichTextField)
  }
  return []
}

function getComponentEntries(data: unknown): unknown[] {
  const parsed = RawPageDataSchema.safeParse(data)
  if (!parsed.success) {
    return []
  }
  return (
    parsed.data.pageCollection?.items?.[0]?.componentsCollection?.items ?? []
  )
}

function collectLinkIdsFromRichText(
  node: RichTextNodeForCollect,
  assetIds: Set<string>,
  entryIds: Set<string>
): void {
  const nodeType = (node.nodeType ?? '').toString().toLowerCase()
  const targetId = node.data?.target?.sys?.id
  if (targetId && ASSET_NODE_TYPES.has(nodeType)) {
    assetIds.add(targetId)
  }
  if (targetId && nodeType === 'entry-hyperlink') {
    entryIds.add(targetId)
  }
  for (const childNode of node.content ?? []) {
    const parsed = RichTextNodeForCollectSchema.safeParse(childNode)
    if (parsed.success) {
      collectLinkIdsFromRichText(parsed.data, assetIds, entryIds)
    }
  }
}

/**
 * Collects asset and entry IDs linked from rich text in TeaserRichText and TeaserAccordion components.
 */
export function collectLinkIdsFromPageResponse(data: unknown): PageLinkIds {
  const assetIds = new Set<string>()
  const entryIds = new Set<string>()
  for (const entry of getComponentEntries(data)) {
    for (const field of getRichTextFields(entry)) {
      const nodeParsed = RichTextNodeForCollectSchema.safeParse(field.json)
      if (nodeParsed.success) {
        collectLinkIdsFromRichText(nodeParsed.data, assetIds, entryIds)
      }
    }
  }
  return { assetIds: [...assetIds], entryIds: [...entryIds] }
}

/** Resolves a linked entry to a URL: pages by slug, link entries by their url. */
function getEntryUrl(entry: EntryItem): string | undefined {
  if (entry.__typename === 'Page' && entry.slug) {
    return `/${entry.slug}`
  }
  if (entry.__typename === 'Link' && entry.url) {
    return entry.url
  }
  return undefined
}

/**
 * Mutates the raw page response: sets `links` on each rich text field
 * so mappers can resolve embedded assets, asset hyperlinks and entry hyperlinks.
 */
export function injectResolvedLinksIntoPageResponse(
  data: unknown,
  assets: AssetItem[],
  entries: EntryItem[]
): void {
  const links: RichTextLinks = {
    assets: { block: assets, hyperlink: assets },
    entries: {
      hyperlink: entries.map((entry) => ({
        sys: entry.sys,
        url: getEntryUrl(entry),
      })),
    },
  }
  for (const entry of getComponentEntries(data)) {
    for (const field of getRichTextFields(entry)) {
      field.links = links
    }
  }
}
