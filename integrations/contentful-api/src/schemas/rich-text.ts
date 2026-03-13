import { z } from 'zod'

/** Re-export Contentful document and node types for API input typing. */
export type { Document, Block, Inline, Text } from '@contentful/rich-text-types'

/**
 * Rich text node for traversal and mapping. Flexible shape (contract-compatible);
 * use Contentful's Document / Block / Inline / Text for strict API input typing.
 */
export type RichTextNode = {
  nodeType?: string
  content?: RichTextNode[]
  data?: Record<string, unknown>
  value?: string
  marks?: unknown[]
}

/** GraphQL rich text links (assets.block / assets.hyperlink). Not part of @contentful/rich-text-types. */
export type RichTextLinks = {
  assets?: {
    block?: Array<{
      sys?: { id?: string }
      url?: string | null
      title?: string | null
      description?: string | null
    }>
    hyperlink?: Array<{
      sys?: { id?: string }
      url?: string | null
      title?: string | null
      description?: string | null
    }>
  }
}

/** Contentful reference (sys.id) used in rich text node data.target. */
export const ContentfulRefSchema = z
  .object({ sys: z.object({ id: z.string().optional() }).optional() })
  .optional()

/** Rich text link node data (url, alt) after resolution. */
export const LinkNodeDataSchema = z
  .object({
    url: z.string().optional(),
    alt: z.string().optional(),
  })
  .catchall(z.unknown())
