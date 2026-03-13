/**
 * CMS-agnostic rich text document type.
 *
 * Structure is compatible with Contentful's rich text JSON; other CMSes (e.g. Strapi)
 * can map their format to this shape in their respective integrations.
 *
 * ## Document structure
 *
 * - **Root**: A single node with `nodeType: 'document'` and a `content` array of block nodes.
 * - **Blocks**: Each block has `nodeType`, optional `content` (for container blocks), optional `data`.
 * - **Inline text**: Leaves use `nodeType: 'text'`, `value`, and optional `marks` for formatting.
 *
 * ## Block node types (rendered by presentation)
 *
 * - **paragraph** – paragraph (`<p>`)
 * - **heading-1** … **heading-6** – headings (`<h1>`–`<h6>`)
 * - **unordered-list** – bullet list (`<ul>`); children: `list-item`
 * - **ordered-list** – numbered list (`<ol>`); children: `list-item`
 * - **list-item** – list item (`<li>`)
 * - **blockquote** – quote (`<blockquote>`)
 * - **hr** – horizontal rule (`<hr>`); no `content`
 * - **table** – table wrapper; children: `table-row`
 * - **table-row** – table row; children: `table-header-cell` or `table-cell`
 * - **table-header-cell** – header cell (`<th>`)
 * - **table-cell** – body cell (`<td>`)
 * - **embedded-asset-block** – block image; `data.url`, `data.alt` (integrations resolve assets to this)
 * - **hyperlink** – link; `data` is CmsLink. Integrations map CMS-specific link types (e.g. entry/asset) to this.
 *
 * ## Inline text and marks
 *
 * - **Text nodes**: `nodeType: 'text'`, `value: string`, optional `marks: Array<{ type: string }>`.
 * - **Marks** (inline formatting) supported by the default renderer:
 *   - `bold` → `<strong>`
 *   - `italic` → `<em>`
 *   - `underline` → `<span class="underline">`
 *   - `code` → `<code>`
 *   - Other mark types may be rendered as a generic `<span>`.
 *
 * ## Embedded assets
 *
 * For `nodeType: 'embedded-asset-block'`, the renderer expects `data.url` and optional `data.alt`.
 * For link nodes, `data` is CmsLink; integrations map CMS link/entry/asset refs to CmsLink (label from content, url resolved).
 *
 * ## Example (all handled block types and marks)
 *
 * ```ts
 * const fullExample: RichTextDocumentResponse = {
 *   nodeType: 'document',
 *   content: [
 *     // Paragraph with inline marks: bold, italic, underline, code
 *     {
 *       nodeType: 'paragraph',
 *       content: [
 *         { nodeType: 'text', value: 'Plain ', marks: [] },
 *         { nodeType: 'text', value: 'bold', marks: [{ type: 'bold' }] },
 *         { nodeType: 'text', value: ', ', marks: [] },
 *         { nodeType: 'text', value: 'italic', marks: [{ type: 'italic' }] },
 *         { nodeType: 'text', value: ', ', marks: [] },
 *         { nodeType: 'text', value: 'underline', marks: [{ type: 'underline' }] },
 *         { nodeType: 'text', value: ', ', marks: [] },
 *         { nodeType: 'text', value: 'code', marks: [{ type: 'code' }] },
 *         { nodeType: 'text', value: '.', marks: [] },
 *       ],
 *     },
 *     // Headings (h1–h6)
 *     { nodeType: 'heading-1', content: [{ nodeType: 'text', value: 'Heading 1', marks: [] }] },
 *     { nodeType: 'heading-2', content: [{ nodeType: 'text', value: 'Heading 2', marks: [] }] },
 *     { nodeType: 'heading-3', content: [{ nodeType: 'text', value: 'Heading 3', marks: [] }] },
 *     { nodeType: 'heading-4', content: [{ nodeType: 'text', value: 'Heading 4', marks: [] }] },
 *     { nodeType: 'heading-5', content: [{ nodeType: 'text', value: 'Heading 5', marks: [] }] },
 *     { nodeType: 'heading-6', content: [{ nodeType: 'text', value: 'Heading 6', marks: [] }] },
 *     // Unordered list
 *     {
 *       nodeType: 'unordered-list',
 *       content: [
 *         { nodeType: 'list-item', content: [{ nodeType: 'paragraph', content: [{ nodeType: 'text', value: 'Bullet one', marks: [] }] }] },
 *         { nodeType: 'list-item', content: [{ nodeType: 'paragraph', content: [{ nodeType: 'text', value: 'Bullet two', marks: [] }] }] },
 *       ],
 *     },
 *     // Ordered list
 *     {
 *       nodeType: 'ordered-list',
 *       content: [
 *         { nodeType: 'list-item', content: [{ nodeType: 'paragraph', content: [{ nodeType: 'text', value: 'First', marks: [] }] }] },
 *         { nodeType: 'list-item', content: [{ nodeType: 'paragraph', content: [{ nodeType: 'text', value: 'Second', marks: [] }] }] },
 *       ],
 *     },
 *     // Blockquote
 *     {
 *       nodeType: 'blockquote',
 *       content: [{ nodeType: 'paragraph', content: [{ nodeType: 'text', value: 'A quoted line.', marks: [] }] }],
 *     },
 *     // Horizontal rule
 *     { nodeType: 'hr' },
 *     // Table (header row + body row)
 *     {
 *       nodeType: 'table',
 *       content: [
 *         {
 *           nodeType: 'table-row',
 *           content: [
 *             { nodeType: 'table-header-cell', content: [{ nodeType: 'text', value: 'Col A', marks: [] }] },
 *             { nodeType: 'table-header-cell', content: [{ nodeType: 'text', value: 'Col B', marks: [] }] },
 *           ],
 *         },
 *         {
 *           nodeType: 'table-row',
 *           content: [
 *             { nodeType: 'table-cell', content: [{ nodeType: 'text', value: 'Cell 1', marks: [] }] },
 *             { nodeType: 'table-cell', content: [{ nodeType: 'text', value: 'Cell 2', marks: [] }] },
 *           ],
 *         },
 *       ],
 *     },
 *     // Embedded image (integrations resolve asset refs to url + alt)
 *     {
 *       nodeType: 'embedded-asset-block',
 *       data: { url: 'https://example.com/image.png', alt: 'Example image' },
 *     },
 *   ],
 * }
 * ```
 */

import { z } from 'zod'
import type { CmsLinkResponse } from './cms-link'

// --- Known values (single source of truth for node types and marks) ---

/** Node types handled by the default presentation renderer. Aligned with migration rich text validations. */
export const RICH_TEXT_NODE_TYPES = [
  'document',
  'paragraph',
  'heading-1',
  'heading-2',
  'heading-3',
  'heading-4',
  'heading-5',
  'heading-6',
  'unordered-list',
  'ordered-list',
  'list-item',
  'blockquote',
  'hr',
  'table',
  'table-row',
  'table-header-cell',
  'table-cell',
  'embedded-asset-block',
  'hyperlink',
  'text',
] as const

/** Inline mark types handled by the default presentation renderer. Other CMSes may use additional values. */
export const RICH_TEXT_MARK_TYPES = [
  'bold',
  'italic',
  'underline',
  'code',
] as const

// --- Schemas (single source of truth; types inferred below) ---

/** Primitive and object values allowed in node `data` (JSON-serializable). Agnostic; no CMS-specific shapes. */
const RichTextNodeDataValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.undefined(),
  z.record(z.string(), z.any()),
])

/** Data shape for `embedded-asset-block` nodes. BFF/integrations always set url and alt (url '' when asset unresolved; alt from title/description or ''). */
export const RichTextEmbeddedAssetDataSchema = z.object({
  url: z.string().default(''),
  alt: z.string().default(''),
})

/** Inline mark on text nodes. */
const RichTextMarkSchema = z.object({
  type: z.union([z.enum(RICH_TEXT_MARK_TYPES), z.string()]),
})

/** Recursive node shape (used only for schema annotation; exported type is inferred). */
export type RichTextDocumentNodeRecursive = {
  nodeType: (typeof RICH_TEXT_NODE_TYPES)[number] | string
  content?: RichTextDocumentNodeRecursive[]
  data?: Record<string, z.infer<typeof RichTextNodeDataValueSchema>>
  value?: string
  marks?: Array<z.infer<typeof RichTextMarkSchema>>
}

/** Recursive schema for a single rich text node (document, block, or inline). */
export const RichTextDocumentNodeSchema: z.ZodType<RichTextDocumentNodeRecursive> =
  z.lazy(() =>
    z.object({
      nodeType: z.union([z.enum(RICH_TEXT_NODE_TYPES), z.string()]),
      content: z.array(RichTextDocumentNodeSchema).optional(),
      data: z.record(z.string(), RichTextNodeDataValueSchema).optional(),
      value: z.string().optional(),
      marks: z.array(RichTextMarkSchema).optional(),
    })
  )

/** Root rich text document – use this to validate API/CMS responses at runtime. */
export const RichTextDocumentResponseSchema = RichTextDocumentNodeSchema

// --- Inferred types ---

/** Node type: known literals from RICH_TEXT_NODE_TYPES or any string (other CMSes). */
export type RichTextNodeType =
  | (typeof RICH_TEXT_NODE_TYPES)[number]
  | (string & {})

/** Inline mark type: known literals from RICH_TEXT_MARK_TYPES or any string. */
export type RichTextMarkType =
  | (typeof RICH_TEXT_MARK_TYPES)[number]
  | (string & {})

/** JSON-serializable primitive values allowed in node `data`. */
export type RichTextNodeDataValue = z.infer<typeof RichTextNodeDataValueSchema>

/** Single rich text node (document, block, or inline). */
export type RichTextDocumentNode = z.infer<typeof RichTextDocumentNodeSchema>

/** Data shape for `embedded-asset-block` nodes. */
export type RichTextEmbeddedAssetData = z.infer<
  typeof RichTextEmbeddedAssetDataSchema
>

/** Node narrowed when nodeType is 'embedded-asset-block'. */
export type RichTextEmbeddedAssetBlockNode = RichTextDocumentNode & {
  nodeType: 'embedded-asset-block'
  data?: RichTextEmbeddedAssetData
}

/** Node narrowed when nodeType is 'hyperlink'. Link data is CmsLinkResponse. */
export type RichTextHyperlinkNode = RichTextDocumentNode & {
  nodeType: 'hyperlink'
  data?: CmsLinkResponse
}

/** Root rich text document (contract shape for API/content). */
export type RichTextDocumentResponse = z.infer<
  typeof RichTextDocumentResponseSchema
>
