/**
 * Rich text documents for demo content (teaserRichText). En-US and de-DE side by side.
 * Shared by homepage and about page. Not run as a migration (runner only runs GG-SS-NN-name.js).
 *
 * Asset links (assetId): reference an image (or file) asset – asset-hyperlink (clickable "image"),
 * embedded-asset-block (the image shown in the body). Pass assetId when creating the teaser to include these.
 * Entry-hyperlink is supported for clickable links to entries; no other embedded types are used.
 */

import { BLOCKS, INLINES, Document } from '@contentful/rich-text-types'

/** Single-paragraph rich text document (e.g. for accordion item body). */
export function richTextFromParagraph(text: string): Document {
  return {
    nodeType: BLOCKS.DOCUMENT,
    data: {},
    content: [
      {
        nodeType: BLOCKS.PARAGRAPH,
        data: {},
        content: [{ nodeType: 'text', value: text, data: {}, marks: [] }],
      },
    ],
  }
}

/** Asset link payload for embedded-asset and asset-hyperlink. */
function assetTarget(assetId: string) {
  return {
    sys: { type: 'Link' as const, linkType: 'Asset' as const, id: assetId },
  }
}

/**
 * Rich text document that demonstrates every enabled node type and mark:
 * headings 1–6, paragraph (with bold, italic, underline, code), unordered-list, ordered-list,
 * blockquote, hr, table, hyperlink; optionally asset-hyperlink and embedded-asset-block when assetId is provided.
 */
export function richTextWithAllPossibilities(
  locale: 'en-US' | 'de-DE',
  options?: { assetId?: string }
): Document {
  const t = locale === 'en-US' ? en : de
  const content: Document['content'] = [
    {
      nodeType: BLOCKS.HEADING_1,
      data: {},
      content: [{ nodeType: 'text', value: t.h1, data: {}, marks: [] }],
    },
    {
      nodeType: BLOCKS.HEADING_2,
      data: {},
      content: [{ nodeType: 'text', value: t.h2, data: {}, marks: [] }],
    },
    {
      nodeType: BLOCKS.HEADING_3,
      data: {},
      content: [{ nodeType: 'text', value: t.h3, data: {}, marks: [] }],
    },
    {
      nodeType: BLOCKS.HEADING_4,
      data: {},
      content: [{ nodeType: 'text', value: t.h4, data: {}, marks: [] }],
    },
    {
      nodeType: BLOCKS.HEADING_5,
      data: {},
      content: [{ nodeType: 'text', value: t.h5, data: {}, marks: [] }],
    },
    {
      nodeType: BLOCKS.HEADING_6,
      data: {},
      content: [{ nodeType: 'text', value: t.h6, data: {}, marks: [] }],
    },
    {
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: [
        { nodeType: 'text', value: t.marksIntro, data: {}, marks: [] },
        {
          nodeType: 'text',
          value: t.bold,
          data: {},
          marks: [{ type: 'bold' }],
        },
        { nodeType: 'text', value: ', ', data: {}, marks: [] },
        {
          nodeType: 'text',
          value: t.italic,
          data: {},
          marks: [{ type: 'italic' }],
        },
        { nodeType: 'text', value: ', ', data: {}, marks: [] },
        {
          nodeType: 'text',
          value: t.underline,
          data: {},
          marks: [{ type: 'underline' }],
        },
        { nodeType: 'text', value: ', ', data: {}, marks: [] },
        {
          nodeType: 'text',
          value: t.code,
          data: {},
          marks: [{ type: 'code' }],
        },
        { nodeType: 'text', value: '.', data: {}, marks: [] },
      ],
    },
    {
      nodeType: BLOCKS.UL_LIST,
      data: {},
      content: t.ulItems.map((item) => ({
        nodeType: BLOCKS.LIST_ITEM,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [{ nodeType: 'text', value: item, data: {}, marks: [] }],
          },
        ],
      })),
    },
    {
      nodeType: BLOCKS.OL_LIST,
      data: {},
      content: t.olItems.map((item) => ({
        nodeType: BLOCKS.LIST_ITEM,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [{ nodeType: 'text', value: item, data: {}, marks: [] }],
          },
        ],
      })),
    },
    {
      nodeType: BLOCKS.QUOTE,
      data: {},
      content: [
        {
          nodeType: BLOCKS.PARAGRAPH,
          data: {},
          content: [{ nodeType: 'text', value: t.quote, data: {}, marks: [] }],
        },
      ],
    },
    { nodeType: BLOCKS.HR, data: {}, content: [] },
    {
      nodeType: BLOCKS.TABLE,
      data: {},
      content: [
        {
          nodeType: BLOCKS.TABLE_ROW,
          data: {},
          content: [
            {
              nodeType: BLOCKS.TABLE_HEADER_CELL,
              data: {},
              content: [
                {
                  nodeType: BLOCKS.PARAGRAPH,
                  data: {},
                  content: [
                    {
                      nodeType: 'text',
                      value: t.tableHeader1,
                      data: {},
                      marks: [],
                    },
                  ],
                },
              ],
            },
            {
              nodeType: BLOCKS.TABLE_HEADER_CELL,
              data: {},
              content: [
                {
                  nodeType: BLOCKS.PARAGRAPH,
                  data: {},
                  content: [
                    {
                      nodeType: 'text',
                      value: t.tableHeader2,
                      data: {},
                      marks: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          nodeType: BLOCKS.TABLE_ROW,
          data: {},
          content: [
            {
              nodeType: BLOCKS.TABLE_CELL,
              data: {},
              content: [
                {
                  nodeType: BLOCKS.PARAGRAPH,
                  data: {},
                  content: [
                    {
                      nodeType: 'text',
                      value: t.tableCell1,
                      data: {},
                      marks: [],
                    },
                  ],
                },
              ],
            },
            {
              nodeType: BLOCKS.TABLE_CELL,
              data: {},
              content: [
                {
                  nodeType: BLOCKS.PARAGRAPH,
                  data: {},
                  content: [
                    {
                      nodeType: 'text',
                      value: t.tableCell2,
                      data: {},
                      marks: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: [
        { nodeType: 'text', value: t.externalLinkIntro, data: {}, marks: [] },
        {
          nodeType: INLINES.HYPERLINK,
          data: { uri: 'https://creativestyle.com/' },
          content: [
            {
              nodeType: 'text',
              value: t.externalLinkLabel,
              data: {},
              marks: [],
            },
          ],
        },
        { nodeType: 'text', value: '.', data: {}, marks: [] },
      ],
    },
  ]

  if (options?.assetId) {
    const target = assetTarget(options.assetId)
    content.push(
      {
        nodeType: BLOCKS.PARAGRAPH,
        data: {},
        content: [
          { nodeType: 'text', value: t.assetLinkIntro, data: {}, marks: [] },
          {
            nodeType: INLINES.ASSET_HYPERLINK,
            data: { target },
            content: [
              {
                nodeType: 'text',
                value: t.assetLinkLabel,
                data: {},
                marks: [],
              },
            ],
          },
          { nodeType: 'text', value: '.', data: {}, marks: [] },
        ],
      },
      {
        nodeType: BLOCKS.EMBEDDED_ASSET,
        data: { target },
        content: [],
      }
    )
  }

  return { nodeType: BLOCKS.DOCUMENT, data: {}, content }
}

const en = {
  h1: 'Rich text: all possibilities',
  h2: 'Headings',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  marksIntro: 'Marks: ',
  bold: 'bold',
  italic: 'italic',
  underline: 'underline',
  code: 'code',
  ulItems: ['Unordered item A', 'Unordered item B'],
  olItems: ['First step', 'Second step'],
  quote: 'This is a blockquote. Quality and style – shop with confidence.',
  tableHeader1: 'Column A',
  tableHeader2: 'Column B',
  tableCell1: 'Cell 1',
  tableCell2: 'Cell 2',
  externalLinkIntro: 'External link: ',
  externalLinkLabel: 'creativestyle.com',
  assetLinkIntro: 'Link to asset: ',
  assetLinkLabel: 'image',
}

const de = {
  h1: 'Rich-Text: alle Möglichkeiten',
  h2: 'Überschriften',
  h3: 'Überschrift 3',
  h4: 'Überschrift 4',
  h5: 'Überschrift 5',
  h6: 'Überschrift 6',
  marksIntro: 'Formatierungen: ',
  bold: 'fett',
  italic: 'kursiv',
  underline: 'unterstrichen',
  code: 'Code',
  ulItems: ['Aufzählung A', 'Aufzählung B'],
  olItems: ['Erster Schritt', 'Zweiter Schritt'],
  quote: 'Ein Zitat. Qualität und Stil – mit Vertrauen einkaufen.',
  tableHeader1: 'Spalte A',
  tableHeader2: 'Spalte B',
  tableCell1: 'Zelle 1',
  tableCell2: 'Zelle 2',
  externalLinkIntro: 'Externer Link: ',
  externalLinkLabel: 'creativestyle.com',
  assetLinkIntro: 'Link zur Datei: ',
  assetLinkLabel: 'Bild',
}

/** Homepage rich text: full example with all node types and marks; pass assetId when creating the teaser to include embedded image. */
export function getRichTextHomepage(options?: {
  assetId?: string
}): Record<string, Document> {
  return {
    'en-US': richTextWithAllPossibilities('en-US', options),
    'de-DE': richTextWithAllPossibilities('de-DE', options),
  }
}

export const RICH_TEXT_ABOUT: Record<string, Document> = {
  'en-US': {
    nodeType: BLOCKS.DOCUMENT,
    data: {},
    content: [
      {
        nodeType: BLOCKS.HEADING_3,
        data: {},
        content: [
          { nodeType: 'text', value: 'Our values', data: {}, marks: [] },
        ],
      },
      {
        nodeType: BLOCKS.PARAGRAPH,
        data: {},
        content: [
          {
            nodeType: 'text',
            value: 'Quality · Transparency · Community · Innovation.',
            data: {},
            marks: [],
          },
        ],
      },
    ],
  },
  'de-DE': {
    nodeType: BLOCKS.DOCUMENT,
    data: {},
    content: [
      {
        nodeType: BLOCKS.HEADING_3,
        data: {},
        content: [
          { nodeType: 'text', value: 'Unsere Werte', data: {}, marks: [] },
        ],
      },
      {
        nodeType: BLOCKS.PARAGRAPH,
        data: {},
        content: [
          {
            nodeType: 'text',
            value: 'Qualität · Transparenz · Gemeinschaft · Innovation.',
            data: {},
            marks: [],
          },
        ],
      },
    ],
  },
}
