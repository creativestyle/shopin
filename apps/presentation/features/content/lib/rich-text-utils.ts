import type {
  RichTextDocumentNode,
  RichTextEmbeddedAssetBlockNode,
  RichTextHyperlinkNode,
} from '@core/contracts/content/rich-text-document'

export function nodeTypeIs(
  node: RichTextDocumentNode,
  expected: string
): boolean {
  const t = (node.nodeType ?? '').toString().toLowerCase()
  return t === expected.toLowerCase()
}

export function isEmbeddedAssetBlock(
  node: RichTextDocumentNode
): node is RichTextEmbeddedAssetBlockNode {
  return (
    (node.nodeType ?? '').toString().toLowerCase() === 'embedded-asset-block'
  )
}

export function isHyperlink(
  node: RichTextDocumentNode
): node is RichTextHyperlinkNode {
  return (node.nodeType ?? '').toString().toLowerCase() === 'hyperlink'
}

export function getTextContent(node: RichTextDocumentNode): string {
  if (nodeTypeIs(node, 'text') && node.value) {
    return node.value
  }
  if (node.content) {
    return node.content.map(getTextContent).join('')
  }
  return ''
}

export function getLinkHref(node: RichTextDocumentNode): string | undefined {
  return isHyperlink(node) ? node.data?.url : undefined
}
