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

const RichTextLinkAssetSchema = z.object({
  sys: z.object({ id: z.string().optional() }).optional(),
  url: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
})

const RichTextLinkEntrySchema = z.object({
  sys: z.object({ id: z.string().optional() }).optional(),
  url: z.string().optional().nullable(),
})

/** Resolved rich text links (assets and entries), injected by page.service before mapping. */
export const RichTextLinksSchema = z.object({
  assets: z
    .object({
      block: z.array(RichTextLinkAssetSchema).optional(),
      hyperlink: z.array(RichTextLinkAssetSchema).optional(),
    })
    .optional(),
  entries: z
    .object({ hyperlink: z.array(RichTextLinkEntrySchema).optional() })
    .optional(),
})

export type RichTextLinks = z.infer<typeof RichTextLinksSchema>

/** Contentful reference (sys.id) used in rich text node data.target. */
export const ContentfulRefSchema = z
  .object({ sys: z.object({ id: z.string().optional() }).optional() })
  .optional()

/** Rich text link node data: url (resolved) or uri (Contentful hyperlink), alt. */
export const LinkNodeDataSchema = z
  .object({
    url: z.string().optional(),
    uri: z.string().optional(),
    alt: z.string().optional(),
  })
  .catchall(z.unknown())
