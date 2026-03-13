import {
  RichTextDocumentResponseSchema,
  type RichTextDocumentResponse,
} from '@core/contracts/content/rich-text-document'
import {
  ContentfulRefSchema,
  LinkNodeDataSchema,
  type RichTextNode,
  type RichTextLinks,
} from '../../schemas/rich-text'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LINK_NODE_TYPES = [
  'hyperlink',
  'entry-hyperlink',
  'asset-hyperlink',
] as const
const LINK_NODE_TYPE_SET = new Set<string>(LINK_NODE_TYPES)

const ASSET_NODE_TYPES = ['embedded-asset-block', 'asset-hyperlink'] as const
const ASSET_NODE_TYPE_SET = new Set<string>(ASSET_NODE_TYPES)

// ---------------------------------------------------------------------------
// Recursion
// ---------------------------------------------------------------------------

function mapNodes(
  node: RichTextNode,
  transform: (node: RichTextNode) => RichTextNode
): RichTextNode {
  const out = transform(node)
  if (out.content?.length) {
    return {
      ...out,
      content: out.content.map((child) => mapNodes(child, transform)),
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Asset resolution
// ---------------------------------------------------------------------------

function buildAssetIdToUrlMap(
  links: RichTextLinks | undefined
): Map<string, { url: string; alt: string }> {
  const map = new Map<string, { url: string; alt: string }>()
  const blocks = links?.assets?.block ?? []
  const hyperlinks = links?.assets?.hyperlink ?? []

  for (const asset of blocks) {
    const id = asset.sys?.id
    if (id && asset.url) {
      const alt = (asset.title ?? asset.description ?? '').trim() || ''
      map.set(id, { url: asset.url, alt })
    }
  }
  for (const asset of hyperlinks) {
    const id = asset.sys?.id
    if (id && asset.url && !map.has(id)) {
      const alt = (asset.title ?? asset.description ?? '').trim() || ''
      map.set(id, { url: asset.url, alt })
    }
  }
  return map
}

function getAssetId(node: RichTextNode): string | undefined {
  const result = ContentfulRefSchema.safeParse(node.data?.target)
  return result.success ? result.data?.sys?.id : undefined
}

function getNormalizedNodeType(node: RichTextNode): string {
  return (node.nodeType ?? '').toString().toLowerCase()
}

function injectAssetUrls(
  node: RichTextNode,
  idToAsset: Map<string, { url: string; alt: string }>
): RichTextNode {
  const nodeType = getNormalizedNodeType(node)
  if (!ASSET_NODE_TYPE_SET.has(nodeType)) {
    return node
  }
  const assetId = getAssetId(node)
  const asset = assetId ? idToAsset.get(assetId) : undefined
  if (nodeType === 'embedded-asset-block') {
    const url = asset?.url ?? ''
    const alt = asset?.alt ?? ''
    return {
      ...node,
      data: { ...node.data, url, alt },
    }
  }
  if (!asset) {
    return node
  }
  return {
    ...node,
    data: { ...node.data, url: asset.url, alt: asset.alt },
  }
}

// ---------------------------------------------------------------------------
// Link normalization
// ---------------------------------------------------------------------------

function getNodeTextContent(node: RichTextNode): string {
  if (node.nodeType === 'text' && node.value) {
    return node.value
  }
  return (node.content ?? []).map(getNodeTextContent).join('')
}

function dataWithoutTarget<T extends Record<string, unknown>>(
  data: T
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => key !== 'target')
  )
}

function normalizeLinkNode(node: RichTextNode): RichTextNode {
  const nodeType = getNormalizedNodeType(node)
  if (!LINK_NODE_TYPE_SET.has(nodeType) || !node.data) {
    return node
  }
  const data = LinkNodeDataSchema.parse(node.data)
  const resolvedUrl = data.url
  if (!resolvedUrl) {
    return node
  }

  const label =
    getNodeTextContent(node) ||
    (nodeType === 'asset-hyperlink' ? (data.alt ?? '') : '')
  return {
    ...node,
    nodeType: 'hyperlink',
    data: {
      ...dataWithoutTarget(data),
      label,
      url: resolvedUrl,
    },
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Injects resolved asset URLs into the document for embedded-asset-block and asset-hyperlink nodes. */
export function mergeRichTextAssetLinks(
  doc: RichTextDocumentResponse,
  links: RichTextLinks | undefined
): RichTextDocumentResponse {
  const idToAsset = buildAssetIdToUrlMap(links)
  if (idToAsset.size === 0) {
    return doc
  }
  const transformed = mapNodes(doc, (node) => injectAssetUrls(node, idToAsset))
  return RichTextDocumentResponseSchema.parse(transformed)
}

/** Normalizes Contentful link nodes to contract shape: nodeType 'hyperlink' with label and url in data. */
export function normalizeRichTextLinkData(
  doc: RichTextDocumentResponse
): RichTextDocumentResponse {
  const transformed = mapNodes(doc, normalizeLinkNode)
  return RichTextDocumentResponseSchema.parse(transformed)
}
