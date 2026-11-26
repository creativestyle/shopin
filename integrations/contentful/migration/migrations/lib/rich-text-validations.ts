/**
 * Single source of allowed Rich Text node types and marks for Contentful field validations.
 *
 * Only node types accepted by the Contentful Migration API may be used. Rejected:
 * paragraph, list-item, table-row, table-header-cell, table-cell.
 * We omit resource-link types (embedded-resource-block, embedded-resource-inline,
 * resource-hyperlink) so validations[].nodes is not required.
 *
 * Kept in sync with @core/contracts/content/rich-text-document where applicable.
 */

export const RICH_TEXT_ENABLED_NODE_TYPES = [
  'heading-1',
  'heading-2',
  'heading-3',
  'heading-4',
  'heading-5',
  'heading-6',
  'ordered-list',
  'unordered-list',
  'hr',
  'blockquote',
  'table',
  'embedded-asset-block',
  'hyperlink',
  'entry-hyperlink',
  'asset-hyperlink',
] as const

export const RICH_TEXT_ENABLED_MARKS = [
  'bold',
  'italic',
  'underline',
  'code',
] as const

/** Use for Contentful Rich Text field validations (enabledNodeTypes + enabledMarks). */
export const RICH_TEXT_VALIDATIONS = [
  { enabledNodeTypes: [...RICH_TEXT_ENABLED_NODE_TYPES] },
  { enabledMarks: [...RICH_TEXT_ENABLED_MARKS] },
]
