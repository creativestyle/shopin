import {
  RawPageDataSchema,
  ComponentEntrySchema,
  RichTextNodeForCollectSchema,
  type RichTextNodeForCollect,
  type AssetItem,
} from '../schemas'

function collectAssetIdsFromRichText(
  node: RichTextNodeForCollect,
  out: Set<string>
): void {
  const nodeType = (node.nodeType ?? '').toString().toLowerCase()
  const assetId = node.data?.target?.sys?.id
  if (
    (nodeType === 'embedded-asset-block' || nodeType === 'asset-hyperlink') &&
    assetId
  ) {
    out.add(assetId)
  }
  for (const childNode of node.content ?? []) {
    const parsed = RichTextNodeForCollectSchema.safeParse(childNode)
    if (parsed.success) {
      collectAssetIdsFromRichText(parsed.data, out)
    }
  }
}

/**
 * Collects asset IDs from all TeaserRichText components in a raw page response.
 */
export function collectAssetIdsFromPageResponse(data: unknown): string[] {
  const parsed = RawPageDataSchema.safeParse(data)
  if (!parsed.success) {
    return []
  }
  const componentEntries =
    parsed.data.pageCollection?.items?.[0]?.componentsCollection?.items ?? []
  const assetIds = new Set<string>()
  for (const componentEntry of componentEntries) {
    const entryParsed = ComponentEntrySchema.safeParse(componentEntry)
    if (
      !entryParsed.success ||
      entryParsed.data.__typename !== 'TeaserRichText' ||
      !entryParsed.data.richText?.json
    ) {
      continue
    }
    const nodeParsed = RichTextNodeForCollectSchema.safeParse(
      entryParsed.data.richText.json
    )
    if (nodeParsed.success) {
      collectAssetIdsFromRichText(nodeParsed.data, assetIds)
    }
  }
  return [...assetIds]
}

/**
 * Mutates the raw page response: sets richText.links on each TeaserRichText
 * so mappers can resolve embedded-asset-block and asset-hyperlink nodes.
 */
export function injectResolvedAssetsIntoPageResponse(
  data: unknown,
  assets: AssetItem[]
): void {
  const root = data as { pageCollection?: { items?: unknown[] } }
  const items = root?.pageCollection?.items
  if (!Array.isArray(items) || items.length === 0) {
    return
  }
  const page = items[0] as { componentsCollection?: { items?: unknown[] } }
  const componentEntries = page?.componentsCollection?.items
  if (!Array.isArray(componentEntries)) {
    return
  }
  const resolvedAssetsLinks = {
    assets: { block: assets, hyperlink: assets },
  }
  for (const entry of componentEntries) {
    const e = entry as {
      __typename?: string
      richText?: { json?: unknown; links?: unknown }
    }
    if (e?.__typename === 'TeaserRichText' && e.richText != null) {
      e.richText.links = resolvedAssetsLinks
    }
  }
}
